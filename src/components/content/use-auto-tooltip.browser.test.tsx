import { useLayoutEffect, useState } from 'react';

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

  it('does not measure during the commit that attaches the label ref', async () => {
    // Sampled from a layout effect, which React runs in the same commit phase
    // as ref attachment and after the children's refs are attached.
    let readsDuringCommit = -1;

    function Harness() {
      useLayoutEffect(() => {
        readsDuringCommit = spy.counter.reads;
      }, []);

      return (
        <div style={{ width: '80px' }}>
          {Array.from({ length: 12 }, (_, i) => (
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
  });

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
  });
});
