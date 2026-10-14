import { StrictMode } from 'react';

import { renderWithRoot, screen, waitFor } from '../../../test';

import { TooltipProvider } from './TooltipProvider';

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
