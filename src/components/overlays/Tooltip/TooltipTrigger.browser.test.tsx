import { createRef, StrictMode, useLayoutEffect } from 'react';
import { page, userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { ListBox } from '../../fields/ListBox/ListBox';

import { Tooltip } from './Tooltip';
import { TooltipTrigger } from './TooltipTrigger';

describe('tooltip positioning', () => {
  afterEach(async () => page.viewport(1000, 800));
  it.each([false, true])(
    'positions before the first painted frame (defaultOpen: %s)',
    async (defaultOpen) => {
      const target = createRef<HTMLButtonElement>();
      const frames: {
        top: number;
        expectedTop: number;
        phase: string | null;
      }[] = [];
      function FirstFrame() {
        useLayoutEffect(() => {
          const frame = requestAnimationFrame(() => {
            const overlay = screen.getByRole('tooltip');
            frames.push({
              top: overlay.getBoundingClientRect().top,
              expectedTop: target.current!.getBoundingClientRect().bottom + 17,
              phase: overlay.getAttribute('data-phase'),
            });
          });
          return () => cancelAnimationFrame(frame);
        }, []);
        return 'First frame';
      }
      const content = (isOpen?: boolean) => (
        <StrictMode>
          <div style={{ padding: 150 }}>
            <TooltipTrigger
              defaultOpen={defaultOpen}
              isOpen={isOpen}
              placement="bottom"
              offset={17}
            >
              {(props, ref) => (
                <button
                  {...props}
                  ref={(node) => {
                    ref.current = node!;
                    target.current = node;
                  }}
                  type="button"
                >
                  Target
                </button>
              )}
              <Tooltip
                styles={{ transition: false, translate: false, scale: false }}
              >
                <FirstFrame />
              </Tooltip>
            </TooltipTrigger>
          </div>
        </StrictMode>
      );
      const { rerender } = renderWithRoot(
        content(defaultOpen ? undefined : false),
      );
      if (!defaultOpen) rerender(content(true));
      await waitFor(() => expect(frames.length).toBeGreaterThan(0));
      expect(frames[0].phase).toBe('enter');
      expect(Math.abs(frames[0].top - frames[0].expectedTop)).toBeLessThan(1);
    },
  );

  it('keeps a second Root positioned after the first unmounts with reduced motion', async () => {
    const matchMedia = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const media = matchMedia(query);
      if (query === '(prefers-reduced-motion: reduce)') {
        Object.defineProperty(media, 'matches', { value: true });
      }
      return media;
    });
    const content = (name: string, isOpen: boolean, padding = 150) => (
      <StrictMode>
        <div style={{ padding }}>
          <TooltipTrigger isOpen={isOpen} placement="bottom" offset={17}>
            {(props, ref) => (
              <button {...props} ref={ref as never} type="button">
                {name}
              </button>
            )}
            <Tooltip qa={name}>{name} details</Tooltip>
          </TooltipTrigger>
        </div>
      </StrictMode>
    );
    const first = renderWithRoot(content('First root', true));
    const second = renderWithRoot(content('Second root', false));
    try {
      second.rerender(content('Second root', true));
      await waitFor(() =>
        expect(screen.getAllByRole('tooltip')).toHaveLength(2),
      );
      first.unmount();
      second.rerender(content('Second root', true, 220));
      await act(async () => {
        window.dispatchEvent(new Event('resize'));
        await new Promise(requestAnimationFrame);
      });
      await waitFor(() => {
        const overlay = screen.getByRole('tooltip');
        expect(overlay).toHaveTextContent('Second root details');
        expect(overlay).toHaveAttribute('data-phase', 'entered');
        expect(
          Math.abs(
            overlay.getBoundingClientRect().top -
              screen.getByRole('button').getBoundingClientRect().bottom -
              17,
          ),
        ).toBeLessThan(1);
      });
      second.rerender(content('Second root', false, 220));
      await waitFor(() =>
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
      );
      second.rerender(content('Second root', true, 220));
      await waitFor(() =>
        expect(screen.getByRole('tooltip')).toHaveAttribute(
          'data-phase',
          'entered',
        ),
      );
    } finally {
      first.unmount();
      second.unmount();
      vi.restoreAllMocks();
    }
  });

  it('positions on first open, follows overlay size, and uses current options after exit/reopen', async () => {
    await page.viewport(1000, 700);
    const first = createRef<HTMLButtonElement>();
    const second = createRef<HTMLButtonElement>();
    const content = (isOpen: boolean, changed = false, long = false) => (
      <StrictMode>
        <div style={{ padding: 150, display: 'flex', gap: 160 }}>
          <button ref={first} type="button">
            First target
          </button>
          <button ref={second} type="button">
            Second target
          </button>
          <TooltipTrigger
            isOpen={isOpen}
            targetRef={(changed ? second : first) as never}
            placement={changed ? 'right' : 'bottom'}
            offset={changed ? 21 : 17}
            crossOffset={changed ? 0 : 9}
          >
            {() => <span>Trigger</span>}
            <Tooltip qa="PositionedTooltip">
              {changed
                ? 'New content'
                : long
                  ? 'A substantially wider tooltip content'
                  : 'Tip'}
            </Tooltip>
          </TooltipTrigger>
        </div>
      </StrictMode>
    );
    const { rerender, unmount } = renderWithRoot(content(false));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    rerender(content(true));

    const expectBelow = () => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-phase', 'entered');
      const box = tooltip.getBoundingClientRect();
      const target = first.current!.getBoundingClientRect();
      expect(Math.abs(box.top - target.bottom - 17)).toBeLessThan(1);
      expect(
        Math.abs(box.left + box.width / 2 - target.left - target.width / 2 - 9),
      ).toBeLessThan(1);
    };
    await waitFor(expectBelow);
    const beforeWidth = screen
      .getByRole('tooltip')
      .getBoundingClientRect().width;
    rerender(content(true, false, true));
    await waitFor(() => {
      expect(
        screen.getByRole('tooltip').getBoundingClientRect().width,
      ).toBeGreaterThan(beforeWidth + 50);
      expectBelow();
    });

    const overlay = screen.getByRole('tooltip');
    const position = { top: overlay.style.top, left: overlay.style.left };
    rerender(content(false, true));
    // Exit keeps the shown content; live positioning configuration must see
    // the closed state even though DisplayTransition retains its render prop.
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'A substantially wider tooltip content',
    );
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise(requestAnimationFrame);
    });
    expect({ top: overlay.style.top, left: overlay.style.left }).toEqual(
      position,
    );

    rerender(content(true, true));
    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('New content');
      expect(tooltip).toHaveAttribute('data-phase', 'entered');
      expect(tooltip).toHaveAttribute('data-placement', 'right');
      expect(
        Math.abs(
          tooltip.getBoundingClientRect().left -
            second.current!.getBoundingClientRect().right -
            21,
        ),
      ).toBeLessThan(1);
    });
    rerender(content(false, true));
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
    unmount();
  });
});

describe('tooltip flipping', () => {
  afterEach(async () => page.viewport(1000, 800));

  const content = (shouldFlip?: boolean) => (
    <div style={{ paddingTop: 4, paddingLeft: 200 }}>
      <TooltipTrigger defaultOpen placement="top">
        {(props, ref) => (
          <button {...props} ref={ref as never} type="button">
            Target
          </button>
        )}
        <Tooltip shouldFlip={shouldFlip}>Details</Tooltip>
      </TooltipTrigger>
    </div>
  );

  it('flips a tooltip with no room above to below its trigger', async () => {
    renderWithRoot(content());

    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'data-placement',
        'bottom',
      ),
    );
  });

  /**
   * `shouldFlip` was destructured by `Tooltip` and never reached the
   * positioning, so `false` still flipped.
   */
  it('keeps the placement with `shouldFlip={false}`', async () => {
    renderWithRoot(content(false));

    const tooltip = await screen.findByRole('tooltip');

    await waitFor(() =>
      expect(tooltip).toHaveAttribute('data-phase', 'entered'),
    );
    expect(tooltip).toHaveAttribute('data-placement', 'top');
  });
});

describe('tooltip scrolling', () => {
  // The enter animation moves the tooltip after `entered`; offsets are
  // compared exactly.
  const NO_MOTION = { transition: false, translate: false, scale: false };

  afterEach(async () => {
    window.scrollTo(0, 0);
    await page.viewport(1000, 800);
  });

  const content = (offset = 80) => (
    <>
      <div data-qa="Other" style={{ height: 60, overflow: 'auto' }}>
        <div style={{ height: 300 }}>Unrelated</div>
      </div>
      <div
        data-qa="Scroller"
        style={{ height: 200, overflow: 'auto', marginTop: 120 }}
      >
        <div style={{ height: 800, paddingTop: offset, paddingLeft: 200 }}>
          <button type="button">Before</button>
          <TooltipTrigger>
            {(props, ref) => (
              <button {...props} ref={ref as never} type="button">
                Target
              </button>
            )}
            <Tooltip styles={NO_MOTION}>Details</Tooltip>
          </TooltipTrigger>
        </div>
      </div>
    </>
  );

  async function frames(count: number) {
    await act(async () => {
      for (let i = 0; i < count; i++) {
        await new Promise(requestAnimationFrame);
      }
    });
  }

  // A scroll is reported on the next frame, and whatever it changes renders
  // after it. Start listening before the scroll.
  function scrollOf(target: EventTarget) {
    const scrolled = new Promise((resolve) =>
      target.addEventListener('scroll', resolve, { once: true }),
    );

    return async () => {
      await act(async () => {
        await scrolled;
      });
      await frames(2);
    };
  }

  async function openByKeyboard() {
    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.keyboard('{Tab}');
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'data-phase',
        'entered',
      ),
    );
  }

  /** The tooltip's offset from its trigger, which a tooltip that follows keeps. */
  function offsetFrom(trigger: Element) {
    const tooltip = screen.getByRole('tooltip').getBoundingClientRect();
    const target = trigger.getBoundingClientRect();

    return {
      top: Math.round(tooltip.top - target.top),
      left: Math.round(tooltip.left - target.left),
    };
  }

  it('closes once its trigger is scrolled out of the scroller’s view', async () => {
    renderWithRoot(content());
    await openByKeyboard();

    const scroller = screen.getByTestId('Scroller');
    const scrolled = scrollOf(scroller);

    scroller.scrollTop = 200;
    await scrolled();

    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
  });

  /**
   * Closing on every scroll of an ancestor, as a popover does, also closed it
   * for a scroll that leaves the trigger in view.
   */
  it('follows its trigger on a scroll that keeps the trigger in view', async () => {
    renderWithRoot(content());
    await openByKeyboard();

    const scroller = screen.getByTestId('Scroller');
    const trigger = screen.getByRole('button', { name: 'Target' });
    const offset = offsetFrom(trigger);
    const triggerTop = trigger.getBoundingClientRect().top;
    const scrolled = scrollOf(scroller);

    scroller.scrollTop = 40;
    await scrolled();

    expect(trigger.getBoundingClientRect().top).toBeCloseTo(triggerTop - 40);
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-phase',
      'entered',
    );
    expect(offsetFrom(trigger)).toEqual(offset);
  });

  it('stays open when an unrelated region scrolls', async () => {
    renderWithRoot(content());
    await openByKeyboard();

    const other = screen.getByTestId('Other');
    const trigger = screen.getByRole('button', { name: 'Target' });
    const offset = offsetFrom(trigger);
    const scrolled = scrollOf(other);

    other.scrollTop = 40;
    await scrolled();

    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-phase',
      'entered',
    );
    expect(offsetFrom(trigger)).toEqual(offset);
  });

  /**
   * Tabbing to a trigger below the fold scrolls it into view, and the browser
   * reports that scroll a frame after the tooltip opened. It must not close
   * the tooltip the keyboard just opened.
   */
  it('stays open when focusing the trigger scrolls it into view', async () => {
    renderWithRoot(content(400));

    const scroller = screen.getByTestId('Scroller');

    screen.getByRole('button', { name: 'Before' }).focus();
    expect(scroller.scrollTop).toBeGreaterThan(0);
    scroller.scrollTop = 0;
    await frames(2);

    const scrolled = scrollOf(scroller);

    await userEvent.keyboard('{Tab}');
    await scrolled();

    expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus();
    expect(scroller.scrollTop).toBeGreaterThan(0);
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'data-phase',
        'entered',
      ),
    );
  });

  /**
   * A list focuses an option without scrolling and scrolls it into view a
   * frame later, after the option's tooltip opened. The tooltip closed on
   * every option that needed the scroll.
   */
  it('keeps the tooltip of each option the keyboard scrolls into view', async () => {
    const names = Array.from({ length: 20 }, (_, i) => `Option ${i}`);

    renderWithRoot(
      <div data-qa="Wrap" style={{ height: 120, overflow: 'auto' }}>
        <ListBox aria-label="Options">
          {names.map((name) => (
            <ListBox.Item key={name} tooltip={`Tip for ${name}`}>
              {name}
            </ListBox.Item>
          ))}
        </ListBox>
      </div>,
    );

    await userEvent.keyboard('{Tab}');

    for (let i = 1; i <= 6; i++) {
      await userEvent.keyboard('{ArrowDown}');
      // The list scrolls on the next frame, and reports it on the one after.
      await frames(3);

      const option = screen.getByRole('option', { name: `Option ${i}` });

      expect(option).toHaveFocus();
      // A closed tooltip is gone well within the timeout, which is shorter
      // than the test's so the failure names this assertion.
      await waitFor(
        () => {
          const tooltip = screen
            .getByText(`Tip for Option ${i}`)
            .closest('[role="tooltip"]')!;
          const box = tooltip.getBoundingClientRect();
          const target = option.getBoundingClientRect();

          expect(tooltip).toHaveAttribute('data-phase', 'entered');
          // Drawn next to the option, wherever the scroll moved it.
          expect(
            Math.max(box.top - target.bottom, target.top - box.bottom),
          ).toBeLessThan(16);
        },
        { timeout: 2000 },
      );
    }

    expect(screen.getByTestId('Wrap').scrollTop).toBeGreaterThan(0);
  });

  /**
   * A fixed trigger stays put when the page scrolls, and the tooltip, which
   * is positioned in the page, scrolled away from it.
   */
  it('keeps a fixed trigger’s tooltip next to it when the page scrolls', async () => {
    renderWithRoot(
      <div style={{ height: 3000 }}>
        <button type="button">Before</button>
        <div style={{ position: 'fixed', top: 200, left: 200 }}>
          <TooltipTrigger>
            {(props, ref) => (
              <button {...props} ref={ref as never} type="button">
                Target
              </button>
            )}
            <Tooltip styles={NO_MOTION}>Details</Tooltip>
          </TooltipTrigger>
        </div>
      </div>,
    );
    await openByKeyboard();

    const trigger = screen.getByRole('button', { name: 'Target' });
    const offset = offsetFrom(trigger);
    const scrolled = scrollOf(document);

    window.scrollTo(0, 300);
    await scrolled();

    expect(window.scrollY).toBe(300);
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-phase',
      'entered',
    );
    expect(offsetFrom(trigger)).toEqual(offset);
  });
});
