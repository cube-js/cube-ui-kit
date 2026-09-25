import { StrictMode, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { act, renderWithRoot, screen, waitFor } from '../../test';
import { Button } from '../actions/Button/Button';

import { useAutoTooltip } from './use-auto-tooltip';

/**
 * Counts reads of `scrollWidth` / `clientWidth` on real elements.
 *
 * Both accessors flush style and layout, so a read from inside React's commit
 * is a forced synchronous reflow.
 */
function spyOnLayoutReads() {
  const proto = Element.prototype;
  const originals = (['scrollWidth', 'clientWidth'] as const).map(
    (name) => [name, Object.getOwnPropertyDescriptor(proto, name)!] as const,
  );
  const counter = { reads: 0 };

  for (const [name, descriptor] of originals) {
    Object.defineProperty(proto, name, {
      ...descriptor,
      get(this: Element) {
        counter.reads++;
        return descriptor.get!.call(this);
      },
    });
  }

  return {
    counter,
    restore: () =>
      originals.forEach(([name, descriptor]) =>
        Object.defineProperty(proto, name, descriptor),
      ),
  };
}

const LONG_LABEL = 'A label far too long to ever fit inside this narrow box';

/**
 * Auto-tooltip overflow measurement, in a real browser.
 *
 * `scrollWidth`/`clientWidth` only mean something where there is layout — jsdom
 * reports 0 for both, so it can neither tell an overflowing label from a
 * fitting one nor see when the measurement happens. It also stubs
 * `ResizeObserver` to a no-op, which is the very mechanism under test.
 *
 * The measurement used to run synchronously inside the callback ref, which
 * React invokes during `commitAttachRef`. Every tooltip-bearing Button, Item
 * and TextItem therefore forced its own style recalc and layout mid-commit —
 * 122ms of `get scrollWidth` in one Cloud profile, more than the whole style
 * engine cost, and 80% of that page's style recalcs were JS-forced. The read
 * belongs off the commit path; the ResizeObserver's initial delivery still
 * runs before paint, so nothing flashes.
 */
describe('useAutoTooltip overflow measurement', () => {
  let spy: ReturnType<typeof spyOnLayoutReads>;

  beforeEach(() => {
    spy = spyOnLayoutReads();
  });

  afterEach(() => {
    spy.restore();
  });

  // Mounting Root plus a handful of Buttons is well under a second locally but
  // has run past the 15s default on a cold CI runner.
  it(
    'does not measure during the commit that attaches the label ref',
    { timeout: 60_000 },
    async () => {
      // Sampled from a layout effect, which React runs in the same commit phase
      // as ref attachment and after the children's refs are attached.
      let readsDuringCommit = -1;

      function Harness() {
        useLayoutEffect(() => {
          readsDuringCommit = spy.counter.reads;
        }, []);

        return (
          <div style={{ width: '80px' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Button key={i} tooltip width="80px">
                {`${LONG_LABEL} ${i}`}
              </Button>
            ))}
          </div>
        );
      }

      await act(async () => {
        renderWithRoot(<Harness />);
      });

      expect(readsDuringCommit).toBe(0);
    },
  );

  describe('still measures overflow off the commit path', () => {
    /** Exposes the hook's overflow verdict, with the label it measures. */
    function Probe({ width, label }: { width: string; label: string }) {
      const { labelRef, isLabelOverflowed, isTooltipActive } = useAutoTooltip({
        tooltip: true,
        children: label,
        labelProps: undefined,
      });

      return (
        <div style={{ width }}>
          <div
            ref={labelRef as never}
            data-qa="Label"
            data-overflowed={String(isLabelOverflowed)}
            data-tooltip-active={String(isTooltipActive)}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
          >
            {label}
          </div>
        </div>
      );
    }

    const label = () => screen.getByTestId('Label');

    /**
     * A list that commits each new row on its own must be able to mount far
     * more than 50 auto-tooltip labels in one task. ag-grid-react 33 is such a
     * list: it wraps every new row's cells in a `flushSync`.
     *
     * React 19 flushes a sync commit's passive effects before `flushSync`
     * returns, at Default priority. A `setState` from there leaves that commit
     * with work pending, which React counts as a nested update, and the count
     * only resets on a commit that leaves nothing behind. One such update per
     * row is a relay, and the row that takes the count past 50 throws "Maximum
     * update depth exceeded" (React error 185). That is how a long Cloud
     * workspace list crashed when it jumped back to the top (CUB-5055,
     * CUB-4908): each overflowing label's mount effect measured synchronously
     * and set the verdict from that flush.
     *
     * The crash is thrown straight out of the `flushSync` that schedules the
     * update past the limit, so it fails the loop itself. Every row overflows,
     * so each one is a candidate link, and every verdict must still arrive once
     * the rows have mounted. React 18 counts only Sync-lane work as nested, so
     * this guards React 19 behaviour; under 18 it would pass either way.
     */
    it(
      'lets a list mount rows one sync commit at a time',
      { timeout: 60_000 },
      async () => {
        const ROWS = 80;
        let addRow = () => {};

        function Rows() {
          const [count, setCount] = useState(0);

          addRow = () => setCount((n) => n + 1);

          return (
            <>
              {Array.from({ length: count }, (_, i) => (
                <Probe key={i} width="80px" label={`${LONG_LABEL} ${i}`} />
              ))}
            </>
          );
        }

        await act(async () => {
          renderWithRoot(<Rows />);
        });

        // Outside `act`, which would otherwise take over React's scheduling:
        // the relay needs every row to commit, effects included, before the
        // next `flushSync` starts — exactly what production does.
        const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
        const wasActEnvironment = env.IS_REACT_ACT_ENVIRONMENT;

        env.IS_REACT_ACT_ENVIRONMENT = false;

        try {
          for (let i = 0; i < ROWS; i++) {
            flushSync(addRow);
          }
        } finally {
          env.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment;
        }

        const labels = screen.getAllByTestId('Label');

        expect(labels).toHaveLength(ROWS);

        await waitFor(() => {
          for (const row of labels) {
            expect(row).toHaveAttribute('data-overflowed', 'true');
          }
        });
      },
    );

    it('detects an overflowing label and activates its tooltip', async () => {
      await act(async () => {
        renderWithRoot(<Probe width="80px" label={LONG_LABEL} />);
      });

      await waitFor(() => {
        expect(label()).toHaveAttribute('data-overflowed', 'true');
      });
      expect(label()).toHaveAttribute('data-tooltip-active', 'true');
      expect(spy.counter.reads).toBeGreaterThan(0);
    });

    it('leaves a label that fits alone', async () => {
      await act(async () => {
        renderWithRoot(<Probe width="600px" label="Short" />);
      });

      await waitFor(() => expect(spy.counter.reads).toBeGreaterThan(0));

      expect(label()).toHaveAttribute('data-overflowed', 'false');
      expect(label()).toHaveAttribute('data-tooltip-active', 'false');
    });

    /**
     * Regression guard for the provider-remount cycle.
     *
     * Real consumers differ from the Probe above in two ways that matter, and
     * together they broke the first version of this fix: `TextItem` and friends
     * build their callback ref inline, so React detaches and re-attaches on
     * every render, and turning the verdict on mounts `TooltipProvider`, which
     * remounts the label underneath it. Clearing the verdict when the node goes
     * away therefore undoes the measurement that had just been made, and the
     * tooltip never activates — five Chromatic stories, none of them visible to
     * a stable-ref probe.
     *
     * The status element sits outside the provider so it survives the remount.
     */
    function RemountProbe() {
      const { labelRef, isTooltipActive, renderWithTooltip } = useAutoTooltip({
        tooltip: true,
        children: LONG_LABEL,
        labelProps: undefined,
      });

      return (
        <div style={{ width: '80px' }}>
          <span data-qa="Status" data-active={String(isTooltipActive)} />
          {renderWithTooltip(
            (triggerProps, ref) => (
              <div
                {...triggerProps}
                // Inline, so its identity changes every render — exactly what
                // TextItem, Item and Button's own wrappers do.
                ref={(element: HTMLElement | null) => {
                  if (ref) (ref as { current: unknown }).current = element;
                  labelRef(element);
                }}
                data-qa="RemountLabel"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
              >
                {LONG_LABEL}
              </div>
            ),
            'top',
          )}
        </div>
      );
    }

    it('activates the tooltip even though mounting it remounts the label', async () => {
      await act(async () => {
        renderWithRoot(<RemountProbe />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('Status')).toHaveAttribute(
          'data-active',
          'true',
        );
      });

      // And stays active rather than being undone by the remount it caused.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });
      expect(screen.getByTestId('Status')).toHaveAttribute(
        'data-active',
        'true',
      );
    });

    /**
     * The remount has to finish before the task that measured ends. Code that
     * looks the label up after that holds a node React is about to replace,
     * so its click goes nowhere. A Storybook play function is such code, and
     * so is anything else that runs once a render has returned.
     *
     * A verdict set from the microtask and left to React's scheduler renders
     * in a later task. That is what Chromatic caught: a Menu story whose
     * truncated trigger button was clicked, and never opened its menu.
     */
    it('remounts the label before the next task can find it', async () => {
      const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
      const wasActEnvironment = env.IS_REACT_ACT_ENVIRONMENT;

      // Outside `act`, as production renders are: nothing drains React's
      // scheduler before the test reads.
      env.IS_REACT_ACT_ENVIRONMENT = false;

      try {
        // A synchronous render. Its `act` returns before the queued check
        // runs, as a production render returns before it.
        renderWithRoot(<RemountProbe />);

        // Resumes after the queued check, like the play function's first read.
        await Promise.resolve();

        const found = screen.getByTestId('RemountLabel');

        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(found.isConnected).toBe(true);
        expect(screen.getByTestId('Status')).toHaveAttribute(
          'data-active',
          'true',
        );
      } finally {
        env.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment;
      }
    });

    /**
     * The condition that kept failing in Chromatic while passing everywhere
     * else: observer callbacks are delivered as part of the rendering steps, so
     * a runner that is not producing frames — a background tab, or a headless
     * browser running a thousand stories at once — can delay them past the
     * point the play function hovers and asks for the tooltip. An
     * implementation that leans on the observer's first delivery for the
     * initial measurement is only as reliable as the runner's frame loop.
     */
    it('activates without the observer ever firing', async () => {
      const RealResizeObserver = window.ResizeObserver;

      // Records the observation but never delivers a callback.
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof RealResizeObserver;

      try {
        await act(async () => {
          renderWithRoot(<RemountProbe />);
        });

        await waitFor(() => {
          expect(screen.getByTestId('Status')).toHaveAttribute(
            'data-active',
            'true',
          );
        });
      } finally {
        window.ResizeObserver = RealResizeObserver;
      }
    });

    /**
     * `isAutoTooltipEnabled` requires string children, and the label unmounts
     * when children stop being a string — the default `Button` path, since
     * `tooltip` defaults to `true`. Flipping it changes the callback ref's
     * identity, so React detaches with the previous callback (which still sees
     * auto tooltips as on, and preserves the verdict) and never attaches the
     * new one, because the label is gone. Without the effect clearing it, the
     * stale `true` keeps a tooltip mounted over content that is no longer text.
     */
    it('drops the verdict when children stop being a string', async () => {
      function Switchable() {
        const [asNode, setAsNode] = useState(false);
        const { labelRef, isTooltipActive, renderWithTooltip } = useAutoTooltip(
          {
            tooltip: true,
            children: asNode ? <span>{LONG_LABEL}</span> : LONG_LABEL,
            labelProps: undefined,
          },
        );

        return (
          <div style={{ width: '80px' }}>
            <button type="button" onClick={() => setAsNode(true)}>
              To node
            </button>
            <span data-qa="Status" data-active={String(isTooltipActive)} />
            {renderWithTooltip(
              () =>
                asNode ? (
                  <div>{LONG_LABEL}</div>
                ) : (
                  <div
                    ref={labelRef as never}
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {LONG_LABEL}
                  </div>
                ),
              'top',
            )}
          </div>
        );
      }

      await act(async () => {
        renderWithRoot(<Switchable />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('Status')).toHaveAttribute(
          'data-active',
          'true',
        );
      });

      await act(async () => {
        screen.getByRole('button', { name: 'To node' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('Status')).toHaveAttribute(
          'data-active',
          'false',
        );
      });
    });

    it('re-measures when the label is resized', async () => {
      function Resizable() {
        const [width, setWidth] = useState('600px');

        return (
          <>
            <button type="button" onClick={() => setWidth('80px')}>
              Shrink
            </button>
            <Probe width={width} label={LONG_LABEL} />
          </>
        );
      }

      await act(async () => {
        renderWithRoot(<Resizable />);
      });

      await waitFor(() => expect(spy.counter.reads).toBeGreaterThan(0));
      expect(label()).toHaveAttribute('data-overflowed', 'false');

      await act(async () => {
        screen.getByRole('button', { name: 'Shrink' }).click();
      });

      await waitFor(() => {
        expect(label()).toHaveAttribute('data-overflowed', 'true');
      });
    });

    /**
     * React 18 Strict Mode replays every effect on mount, cleanup then setup,
     * but leaves refs attached. React 19 detaches and re-attaches them too.
     * Teardown kept in an effect therefore dropped the label and its observer
     * in the replay while the label stayed mounted, and nothing brought them
     * back: the queued first check found no node, and later resizes went
     * unobserved. Only the React 18 run can fail here.
     */
    it('keeps measuring a label mounted in Strict Mode', async () => {
      function Resizable() {
        const [width, setWidth] = useState('80px');

        return (
          <>
            <button type="button" onClick={() => setWidth('600px')}>
              Grow
            </button>
            <Probe width={width} label={LONG_LABEL} />
          </>
        );
      }

      await act(async () => {
        renderWithRoot(
          <StrictMode>
            <Resizable />
          </StrictMode>,
        );
      });

      await waitFor(() => {
        expect(label()).toHaveAttribute('data-overflowed', 'true');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Grow' }).click();
      });

      await waitFor(() => {
        expect(label()).toHaveAttribute('data-overflowed', 'false');
      });
    });
  });
});
