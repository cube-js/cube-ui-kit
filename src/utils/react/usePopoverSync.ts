import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!enabled) return;
    return on('popover:open', (data: { menuId: string }) => {
      if (data.menuId !== menuId && isOpenRef.current) {
        onCloseRef.current();
      }
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
      emit('popover:open', { menuId });
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, emit, menuId, enabled]);
}
