import { RefObject, StrictMode } from 'react';

import {
  act,
  hoverWithPointer,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';

import { CubeTooltipProviderProps, TooltipProvider } from './TooltipProvider';

function renderTrigger(props: Omit<CubeTooltipProviderProps, 'children'>) {
  return renderWithRoot(
    <TooltipProvider {...props}>
      {(triggerProps, ref?: RefObject<HTMLElement>) => (
        <button {...triggerProps} ref={ref as never} type="button">
          Trigger
        </button>
      )}
    </TooltipProvider>,
  );
}

/** Past the default open delay, so a tooltip that was going to open has. */
function waitPastDelay() {
  return act(() => new Promise((resolve) => setTimeout(resolve, 400)));
}

describe('tooltip trigger options', () => {
  it('closes on press by default', async () => {
    renderTrigger({ title: 'Tip' });

    await hoverWithPointer(screen.getByRole('button'));
    await screen.findByRole('tooltip');

    await userEvent.click(screen.getByRole('button'));

    // Closed at once; the bubble itself leaves after its exit transition.
    await waitFor(() =>
      expect(screen.getByRole('button')).not.toHaveAttribute(
        'aria-describedby',
      ),
    );
  });

  /**
   * Documented on `TooltipTrigger` but never handed to React Aria, so every
   * press closed the tooltip whatever the prop said.
   */
  it('stays open on press with `shouldCloseOnPress={false}`', async () => {
    renderTrigger({ title: 'Tip', shouldCloseOnPress: false });

    await hoverWithPointer(screen.getByRole('button'));
    await screen.findByRole('tooltip');

    await userEvent.click(screen.getByRole('button'));
    await waitPastDelay();

    expect(screen.getByRole('tooltip')).toHaveTextContent('Tip');
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-describedby',
      screen.getByRole('tooltip').id,
    );
  });

  /**
   * The docs turn a tooltip off with `title={null}`. Nothing checked for empty
   * content, so the trigger opened an empty bubble and described itself by it.
   */
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
  ])('opens nothing for %s content', async (_, title) => {
    renderTrigger({ title });

    await hoverWithPointer(screen.getByRole('button', { name: 'Trigger' }));
    await waitPastDelay();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trigger' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });
});

describe('tooltip positioning lifetime', () => {
  it('observes only shown/closing overlays and releases their targets', async () => {
    const targets = new Map<ResizeObserver, Set<Element>>();
    const Observer = globalThis.ResizeObserver;
    class TrackedObserver extends Observer {
      observe(element: Element) {
        const nodes = targets.get(this) ?? new Set<Element>();
        nodes.add(element);
        targets.set(this, nodes);
      }
      unobserve(element: Element) {
        targets.get(this)?.delete(element);
      }
      disconnect() {
        targets.delete(this);
      }
    }
    vi.stubGlobal('ResizeObserver', TrackedObserver);
    const isObserved = (element: Element) =>
      [...targets.values()].some((nodes) => nodes.has(element));
    const content = (isOpen: boolean) => (
      <StrictMode>
        <TooltipProvider isOpen={isOpen} title="Details">
          {(props, ref) => (
            <button {...props} ref={ref as never} type="button">
              Trigger
            </button>
          )}
        </TooltipProvider>
      </StrictMode>
    );

    const { rerender, unmount } = renderWithRoot(content(false));
    try {
      const trigger = screen.getByRole('button');
      expect(isObserved(trigger)).toBe(false);

      rerender(content(true));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Details');
        expect(isObserved(trigger)).toBe(true);
        expect(isObserved(screen.getByRole('tooltip'))).toBe(true);
      });

      rerender(content(false));
      await waitFor(() =>
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
      );
      expect(isObserved(trigger)).toBe(false);

      rerender(content(true));
      await waitFor(() => expect(isObserved(trigger)).toBe(true));
      unmount();
      expect(isObserved(trigger)).toBe(false);
    } finally {
      unmount();
      vi.unstubAllGlobals();
    }
  });

  it('keeps the last shown content during exit and accepts new content on reopen', async () => {
    const content = (isOpen: boolean, title: string) => (
      <TooltipProvider isOpen={isOpen} title={title}>
        {(props, ref) => (
          <button {...props} ref={ref as never} type="button">
            Trigger
          </button>
        )}
      </TooltipProvider>
    );
    const { rerender } = renderWithRoot(content(true, 'Before'));
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Before'),
    );

    rerender(content(false, 'After'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Before');
    rerender(content(true, 'After'));
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('After'),
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-describedby',
      screen.getByRole('tooltip').id,
    );
  });
});
