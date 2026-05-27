import { ReactNode, useEffect, useRef } from 'react';

import { act, renderHook } from '../../test';

import { EventBusProvider, useEventBus } from './useEventBus';
import { usePopoverSync } from './usePopoverSync';

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
});
