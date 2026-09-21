import { useEvent } from '../../_internal';

import type { DOMAttributes, KeyboardEvent } from 'react';

type OverlayDOMProps = DOMAttributes<any>;

/**
 * Stops a CLOSED overlay from answering for `Escape` (CUB-4839).
 *
 * `useOverlay`'s `Escape` handler calls `stopPropagation()` and
 * `preventDefault()` for every `Escape` it sees, and only THEN asks whether
 * this overlay is the topmost one allowed to act on it — unlike
 * `onInteractOutside`, which it gates on `isOpen` up front. An overlay that has
 * already closed therefore consumes the key and does nothing with it, so the
 * `Escape` meant for the Dialog around it closes nothing at all.
 *
 * That is reachable here because our overlays stay mounted for their exit
 * transition while still holding DOM focus: pick an option from a list inside a
 * Dialog and the very next `Escape` lands in the closing list.
 *
 * Passing `useOverlay` an `isKeyboardDismissDisabled` of its own does NOT work,
 * and that is the reason this exists. `DisplayTransition` preserves content
 * across an exit by replaying the children it stored while the overlay was
 * open, so every value that subtree captured — `isKeyboardDismissDisabled`
 * included — stays frozen at its open-state reading for exactly the window
 * this has to guard. `useEvent` gets around it by returning a handler whose
 * identity never changes while its body always runs the latest render's
 * closure, so the frozen copy still sees the current `isOpen`.
 */
export function useOverlayEscapeGuard<T extends OverlayDOMProps>(
  overlayProps: T,
  isOpen: boolean | undefined,
): T {
  const onKeyDown = useEvent((event: KeyboardEvent<any>) => {
    // Decline it, so it reaches whoever can actually act on it.
    if (event.key === 'Escape' && !isOpen) return;

    overlayProps.onKeyDown?.(event);
  });

  return { ...overlayProps, onKeyDown };
}
