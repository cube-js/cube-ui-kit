import { ReactNode, useEffect, useRef } from 'react';

import { act, renderHook } from '../../test';

import { EventBusProvider, useEventBus } from './useEventBus';
import { useDismissParentPopover, usePopoverSync } from './usePopoverSync';

const HookWrapper = ({ children }: { children: ReactNode }) => (
  <EventBusProvider>{children}</EventBusProvider>
);

// `emit` from useEventBus is `setTimeout(0)`-deferred, so flush to drain it.
const flushBus = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('usePopoverSync', () => {
  it('emits popover:open once on the false -> true transition and not on idle re-renders', async () => {
    const observer = vi.fn();

    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => {
        const { on } = useEventBus();
        // Subscribe a stable observer once on mount.
        useEffect(() => on('popover:open', observer), [on]);
        usePopoverSync({ menuId: 'a', isOpen, onClose: () => {} });
      },
      { wrapper: HookWrapper, initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });
    await flushBus();
    expect(observer).toHaveBeenCalledTimes(1);

    // Idle re-render while still open must NOT re-emit.
    rerender({ isOpen: true });
    await flushBus();
    expect(observer).toHaveBeenCalledTimes(1);

    // Close, then re-open: should emit again.
    rerender({ isOpen: false });
    await flushBus();
    rerender({ isOpen: true });
    await flushBus();
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it('two peers: opening B closes A; B ignores its own emit', async () => {
    const closeA = vi.fn();
    const closeB = vi.fn();

    const { rerender } = renderHook(
      ({ a, b }: { a: boolean; b: boolean }) => {
        usePopoverSync({ menuId: 'a', isOpen: a, onClose: closeA });
        usePopoverSync({ menuId: 'b', isOpen: b, onClose: closeB });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false },
      },
    );

    rerender({ a: true, b: false });
    await flushBus();
    expect(closeA).not.toHaveBeenCalled();
    expect(closeB).not.toHaveBeenCalled();

    // Open B: A's listener fires. B's listener ignores its own emit.
    rerender({ a: true, b: true });
    await flushBus();
    expect(closeA).toHaveBeenCalledTimes(1);
    expect(closeB).not.toHaveBeenCalled();
  });

  it('always reads the latest onClose without resubscribing', async () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ a, b, onClose }: { a: boolean; b: boolean; onClose: () => void }) => {
        usePopoverSync({ menuId: 'a', isOpen: a, onClose });
        usePopoverSync({ menuId: 'b', isOpen: b, onClose: () => {} });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false, onClose: first },
      },
    );

    rerender({ a: true, b: false, onClose: first });
    await flushBus();
    // Swap onClose identity while A is still open; subscription must NOT churn.
    rerender({ a: true, b: false, onClose: second });
    await flushBus();
    // Trigger a peer open so A's listener fires.
    rerender({ a: true, b: true, onClose: second });
    await flushBus();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('nested: peer whose trigger lives inside our containerRef does not close us', async () => {
    const closeA = vi.fn();
    const closeB = vi.fn();

    // Build the DOM shape that the nesting guard reads. `bTrigger` is rendered
    // inside `aContainer` to mimic a popover (B) opened from inside another
    // popover's content (A).
    const aContainer = document.createElement('div');
    const aTrigger = document.createElement('button');
    const bTrigger = document.createElement('button');
    document.body.append(aContainer, aTrigger);
    aContainer.append(bTrigger);

    const { rerender } = renderHook(
      ({ a, b }: { a: boolean; b: boolean }) => {
        const aTriggerRef = useRef<HTMLElement | null>(aTrigger);
        const aContainerRef = useRef<HTMLElement | null>(aContainer);
        const bTriggerRef = useRef<HTMLElement | null>(bTrigger);
        usePopoverSync({
          menuId: 'a',
          isOpen: a,
          onClose: closeA,
          triggerRef: aTriggerRef,
          containerRef: aContainerRef,
        });
        usePopoverSync({
          menuId: 'b',
          isOpen: b,
          onClose: closeB,
          triggerRef: bTriggerRef,
        });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false },
      },
    );

    rerender({ a: true, b: false });
    await flushBus();
    // Opening B: A's listener sees B's trigger inside `aContainer` and stays
    // open. B opens normally and is unaffected (its own emit is ignored by
    // identity check).
    rerender({ a: true, b: true });
    await flushBus();
    expect(closeA).not.toHaveBeenCalled();
    expect(closeB).not.toHaveBeenCalled();

    aTrigger.remove();
    aContainer.remove();
  });

  it('logical nesting across portals: opening a grandchild popover does not close the grandparent', async () => {
    // Build the shape of 3 nested popovers as the Overlay portal would
    // produce: each popover container is a sibling of the others (not a
    // DOM descendant), but each popover's TRIGGER lives inside its
    // parent's container. This mirrors the SubMenuTrigger story where
    // popover content is portaled to `document.body`.
    const aContainer = document.createElement('div');
    const aTrigger = document.createElement('button');
    const bContainer = document.createElement('div');
    const bTrigger = document.createElement('button');
    const cContainer = document.createElement('div');
    const cTrigger = document.createElement('button');
    // a's trigger lives outside any popover; a's container is portaled
    // alongside it. b's trigger is rendered into a's container; b's
    // container is portaled separately. Same for c relative to b.
    document.body.append(aTrigger, aContainer, bContainer, cContainer);
    aContainer.append(bTrigger);
    bContainer.append(cTrigger);

    const closeA = vi.fn();
    const closeB = vi.fn();
    const closeC = vi.fn();

    const { rerender } = renderHook(
      ({ a, b, c }: { a: boolean; b: boolean; c: boolean }) => {
        const aTriggerRef = useRef<HTMLElement | null>(aTrigger);
        const aContainerRef = useRef<HTMLElement | null>(aContainer);
        const bTriggerRef = useRef<HTMLElement | null>(bTrigger);
        const bContainerRef = useRef<HTMLElement | null>(bContainer);
        const cTriggerRef = useRef<HTMLElement | null>(cTrigger);
        const cContainerRef = useRef<HTMLElement | null>(cContainer);
        usePopoverSync({
          menuId: 'a',
          isOpen: a,
          onClose: closeA,
          triggerRef: aTriggerRef,
          containerRef: aContainerRef,
        });
        usePopoverSync({
          menuId: 'b',
          isOpen: b,
          onClose: closeB,
          triggerRef: bTriggerRef,
          containerRef: bContainerRef,
        });
        usePopoverSync({
          menuId: 'c',
          isOpen: c,
          onClose: closeC,
          triggerRef: cTriggerRef,
          containerRef: cContainerRef,
        });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false, c: false },
      },
    );

    rerender({ a: true, b: false, c: false });
    await flushBus();
    rerender({ a: true, b: true, c: false });
    await flushBus();
    expect(closeA).not.toHaveBeenCalled();
    expect(closeB).not.toHaveBeenCalled();

    // Open c (the grandchild). Without logical-chain traversal, a closes
    // here because c's trigger lives in b's container (sibling portal),
    // not directly in a's container — which is the regression we are
    // guarding against.
    rerender({ a: true, b: true, c: true });
    await flushBus();
    expect(closeA).not.toHaveBeenCalled();
    expect(closeB).not.toHaveBeenCalled();
    expect(closeC).not.toHaveBeenCalled();

    aTrigger.remove();
    aContainer.remove();
    bContainer.remove();
    cContainer.remove();
  });

  it('non-nested: peer whose trigger lives outside our containerRef closes us', async () => {
    const closeA = vi.fn();
    const closeB = vi.fn();

    const aContainer = document.createElement('div');
    const aTrigger = document.createElement('button');
    const bTrigger = document.createElement('button');
    // bTrigger is a sibling of aContainer — explicitly NOT nested.
    document.body.append(aContainer, aTrigger, bTrigger);

    const { rerender } = renderHook(
      ({ a, b }: { a: boolean; b: boolean }) => {
        const aTriggerRef = useRef<HTMLElement | null>(aTrigger);
        const aContainerRef = useRef<HTMLElement | null>(aContainer);
        const bTriggerRef = useRef<HTMLElement | null>(bTrigger);
        usePopoverSync({
          menuId: 'a',
          isOpen: a,
          onClose: closeA,
          triggerRef: aTriggerRef,
          containerRef: aContainerRef,
        });
        usePopoverSync({
          menuId: 'b',
          isOpen: b,
          onClose: closeB,
          triggerRef: bTriggerRef,
        });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false },
      },
    );

    rerender({ a: true, b: false });
    await flushBus();
    rerender({ a: true, b: true });
    await flushBus();
    expect(closeA).toHaveBeenCalledTimes(1);
    expect(closeB).not.toHaveBeenCalled();

    aTrigger.remove();
    aContainer.remove();
    bTrigger.remove();
  });

  it('closeOnPeerOpen=false: peer popover opening does not close us, but our open still emits to peers (modal scope)', async () => {
    const closeModal = vi.fn();
    const closePopover = vi.fn();

    const { rerender } = renderHook(
      ({ modal, popover }: { modal: boolean; popover: boolean }) => {
        // Mimic a modal Dialog: emits to dismiss peer popovers, but does NOT
        // listen for peer popover opens (so it can't be yanked shut bypassing
        // isDismissable when a popover opens programmatically while it's up).
        usePopoverSync({
          menuId: 'modal',
          isOpen: modal,
          onClose: closeModal,
          dismissOnInnerButtonPress: false,
          closeOnPeerOpen: false,
        });
        usePopoverSync({
          menuId: 'popover',
          isOpen: popover,
          onClose: closePopover,
        });
      },
      {
        wrapper: HookWrapper,
        initialProps: { modal: false, popover: true },
      },
    );

    // Popover opens first.
    await flushBus();
    expect(closeModal).not.toHaveBeenCalled();
    expect(closePopover).not.toHaveBeenCalled();

    // Modal opens. Its emit must close the peer popover (modal "wins").
    rerender({ modal: true, popover: true });
    await flushBus();
    expect(closePopover).toHaveBeenCalledTimes(1);
    expect(closeModal).not.toHaveBeenCalled();

    // Now the regression: while the modal is up, a peer popover opens
    // programmatically. The modal must stay open — its onClose must NOT be
    // called via the popover:open path (that would bypass isDismissable).
    rerender({ modal: true, popover: false });
    await flushBus();
    rerender({ modal: true, popover: true });
    await flushBus();
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('enabled=false: no emit and no peer-close', async () => {
    const closeA = vi.fn();
    const closeB = vi.fn();

    const { rerender } = renderHook(
      ({ a, b }: { a: boolean; b: boolean }) => {
        usePopoverSync({
          menuId: 'a',
          isOpen: a,
          onClose: closeA,
          enabled: false,
        });
        usePopoverSync({ menuId: 'b', isOpen: b, onClose: closeB });
      },
      {
        wrapper: HookWrapper,
        initialProps: { a: false, b: false },
      },
    );

    // Open A while disabled — must not emit, so B (which is closed anyway)
    // observes nothing.
    rerender({ a: true, b: false });
    await flushBus();
    expect(closeB).not.toHaveBeenCalled();

    // Open B — A is disabled so it does not listen and stays open silently.
    rerender({ a: true, b: true });
    await flushBus();
    expect(closeA).not.toHaveBeenCalled();
  });

  describe('popover:dismiss-ancestor', () => {
    it('closes the popover when the dispatching element is inside its containerRef', async () => {
      const closeA = vi.fn();

      const aContainer = document.createElement('div');
      const aTrigger = document.createElement('button');
      const innerButton = document.createElement('button');
      document.body.append(aContainer, aTrigger);
      aContainer.append(innerButton);

      const { result } = renderHook(
        () => {
          const aTriggerRef = useRef<HTMLElement | null>(aTrigger);
          const aContainerRef = useRef<HTMLElement | null>(aContainer);
          usePopoverSync({
            menuId: 'a',
            isOpen: true,
            onClose: closeA,
            triggerRef: aTriggerRef,
            containerRef: aContainerRef,
          });
          return useDismissParentPopover();
        },
        { wrapper: HookWrapper },
      );

      act(() => {
        result.current(innerButton);
      });
      await flushBus();
      expect(closeA).toHaveBeenCalledTimes(1);

      aTrigger.remove();
      aContainer.remove();
    });

    it('does NOT close the popover when the dispatching element is outside its containerRef', async () => {
      const closeA = vi.fn();

      const aContainer = document.createElement('div');
      const aTrigger = document.createElement('button');
      const outerButton = document.createElement('button');
      document.body.append(aContainer, aTrigger, outerButton);

      const { result } = renderHook(
        () => {
          const aTriggerRef = useRef<HTMLElement | null>(aTrigger);
          const aContainerRef = useRef<HTMLElement | null>(aContainer);
          usePopoverSync({
            menuId: 'a',
            isOpen: true,
            onClose: closeA,
            triggerRef: aTriggerRef,
            containerRef: aContainerRef,
          });
          return useDismissParentPopover();
        },
        { wrapper: HookWrapper },
      );

      act(() => {
        result.current(outerButton);
      });
      await flushBus();
      expect(closeA).not.toHaveBeenCalled();

      aTrigger.remove();
      aContainer.remove();
      outerButton.remove();
    });

    it('does NOT close when no containerRef is set (host has no way to compute containment)', async () => {
      const closeA = vi.fn();
      const somewhere = document.createElement('button');
      document.body.append(somewhere);

      const { result } = renderHook(
        () => {
          usePopoverSync({ menuId: 'a', isOpen: true, onClose: closeA });
          return useDismissParentPopover();
        },
        { wrapper: HookWrapper },
      );

      act(() => {
        result.current(somewhere);
      });
      await flushBus();
      expect(closeA).not.toHaveBeenCalled();

      somewhere.remove();
    });

    it('does NOT close when isOpen=false', async () => {
      const closeA = vi.fn();

      const aContainer = document.createElement('div');
      const innerButton = document.createElement('button');
      document.body.append(aContainer);
      aContainer.append(innerButton);

      const { result } = renderHook(
        () => {
          const aContainerRef = useRef<HTMLElement | null>(aContainer);
          usePopoverSync({
            menuId: 'a',
            isOpen: false,
            onClose: closeA,
            containerRef: aContainerRef,
          });
          return useDismissParentPopover();
        },
        { wrapper: HookWrapper },
      );

      act(() => {
        result.current(innerButton);
      });
      await flushBus();
      expect(closeA).not.toHaveBeenCalled();

      aContainer.remove();
    });

    it('dismissOnInnerButtonPress=false: never closes regardless of containment (modal scope)', async () => {
      const closeA = vi.fn();

      const aContainer = document.createElement('div');
      const innerButton = document.createElement('button');
      document.body.append(aContainer);
      aContainer.append(innerButton);

      const { result } = renderHook(
        () => {
          const aContainerRef = useRef<HTMLElement | null>(aContainer);
          usePopoverSync({
            menuId: 'a',
            isOpen: true,
            onClose: closeA,
            containerRef: aContainerRef,
            dismissOnInnerButtonPress: false,
          });
          return useDismissParentPopover();
        },
        { wrapper: HookWrapper },
      );

      act(() => {
        result.current(innerButton);
      });
      await flushBus();
      expect(closeA).not.toHaveBeenCalled();

      aContainer.remove();
    });

    it('useDismissParentPopover outside EventBusProvider is a no-op (does not throw)', () => {
      const { result } = renderHook(() => useDismissParentPopover());
      // No EventBusProvider in the wrapper; calling the dispatcher should
      // gracefully degrade rather than crashing the consumer.
      expect(() =>
        result.current(document.createElement('button')),
      ).not.toThrow();
    });
  });
});
