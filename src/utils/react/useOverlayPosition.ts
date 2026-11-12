import { useEffect, useEffectEvent } from 'react';
// oxlint-disable-next-line no-restricted-imports -- this is the wrapper the restriction points to
import { useOverlayPosition as useAriaOverlayPosition } from 'react-aria';

import type { AriaPositionProps, PositionAria } from 'react-aria';

/**
 * React Aria's `useOverlayPosition`, which also re-places the overlay whenever
 * it changes size while open: a menu that gains an item, a list that filters,
 * a calendar that shows a sixth week.
 *
 * React Aria does observe the overlay's size, but it attaches that observer
 * only once, when the hook first runs, and only if the overlay is already in
 * the DOM then. Every kit trigger outlives its overlay, so it runs the hook
 * before the overlay exists: no observer ever attached, and an open overlay
 * that grew kept its old place, past the edge of the screen. This observer
 * attaches on every opening instead.
 */
export function useOverlayPosition(props: AriaPositionProps): PositionAria {
  const position = useAriaOverlayPosition(props);
  const { overlayRef, isOpen = true } = props;

  const onResize = useEffectEvent(() => {
    position.updatePosition();
  });

  // The overlay mounts in the commit that opens it, so it is in the ref by
  // the time this runs.
  useEffect(() => {
    const overlay = overlayRef.current;

    if (!isOpen || !overlay || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => onResize());

    observer.observe(overlay);

    return () => observer.disconnect();
  }, [isOpen, overlayRef]);

  return position;
}
