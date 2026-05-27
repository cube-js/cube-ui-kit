import { RefObject, useEffect, useRef } from 'react';

import { useEventBus } from './useEventBus';

export interface UsePopoverSyncOptions {
  /** Stable identifier for this popover instance (typically a generateRandomId() memo). */
  menuId: string;
  /** Current open state of this popover. */
  isOpen: boolean;
  /** Called when another popover opens while this one is open. */
  onClose: () => void;
  /**
   * When `false`, this popover does not participate in the sync (no listening,
   * no emitting). Useful for "dummy" triggers that proxy a real one (see
   * `MenuTrigger`'s `isDummy`). Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Ref to the popover's trigger element. When provided, the element is
   * included in the `popover:open` emit payload so peers can detect whether
   * the new opener is nested inside their own overlay (and skip closing in
   * that case). Optional — omitting it preserves the legacy "always close on
   * peer open" behaviour.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /**
   * Ref to the overlay/container element that hosts this popover's content.
   * When provided, the listener performs a DOM `contains()` check on incoming
   * peer triggers: peers whose trigger lives inside this container are
   * considered nested children and do NOT close us.
   */
  containerRef?: RefObject<HTMLElement | null>;
}

interface PopoverOpenPayload {
  menuId: string;
  triggerEl: Element | null;
}

/**
 * Coordinates the "only one popover open at a time" invariant via the EventBus.
 *
 * - When `isOpen` flips `false -> true`, emits `popover:open` once.
 * - While open, listens for peers' `popover:open` events and calls `onClose`.
 *
 * Implementation notes (ALL of these matter — losing any one re-introduces a
 * race that surfaces only under rapid trigger switching, which is hard to
 * reproduce in tests):
 *
 * 1. `isOpen` and `onClose` are read through refs inside the listener, so the
 *    subscription effect's dep array does NOT include `isOpen`/`onClose`. This
 *    keeps the listener identity stable across open/close transitions and
 *    avoids the unsubscribe-emit-resubscribe window where an emit can be
 *    delivered to a stale listener (or no listener).
 * 2. The emit fires only on the `false -> true` transition, gated by
 *    `wasOpenRef`. A re-render where `isOpen` is still `true` must NOT
 *    re-emit, otherwise it could re-trigger listeners on peers that just
 *    opened in the same render flush.
 * 3. The `enabled` flag short-circuits both effects symmetrically. When it
 *    flips off, `wasOpenRef` is reset so re-enabling later still emits if
 *    `isOpen` is true at that moment.
 */
export function usePopoverSync({
  menuId,
  isOpen,
  onClose,
  enabled = true,
  triggerRef,
  containerRef,
}: UsePopoverSyncOptions): void {
  const { emit, on } = useEventBus();

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Track the latest containerRef via a stable ref-of-refs so the listener
  // never resubscribes when callers pass freshly-created ref wrappers across
  // renders. Same pattern as `onCloseRef` above — without this the listener's
  // effect would churn for any caller that doesn't memoize its refs.
  const containerRefRef = useRef(containerRef);
  useEffect(() => {
    containerRefRef.current = containerRef;
  }, [containerRef]);

  const triggerRefRef = useRef(triggerRef);
  useEffect(() => {
    triggerRefRef.current = triggerRef;
  }, [triggerRef]);

  useEffect(() => {
    if (!enabled) return;
    return on('popover:open', (data: PopoverOpenPayload) => {
      if (data.menuId === menuId || !isOpenRef.current) return;
      const container = containerRefRef.current?.current;
      const triggerEl = data.triggerEl;
      // Nested-popover guard: if the peer's trigger lives inside our own
      // overlay, treat the open as a child interaction and stay open.
      if (container && triggerEl && container.contains(triggerEl)) return;
      onCloseRef.current();
    });
  }, [on, menuId, enabled]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!enabled) {
      wasOpenRef.current = false;
      return;
    }
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      emit<PopoverOpenPayload>('popover:open', {
        menuId,
        triggerEl: triggerRefRef.current?.current ?? null,
      });
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, emit, menuId, enabled]);
}
