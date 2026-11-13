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
 * the DOM then. A trigger that outlives its overlay (every kit overlay but the
 * tooltip) runs the hook before the overlay exists, so no observer attached,
 * and an open overlay that grew kept its old place, past the edge of the
 * screen. This observer attaches on every opening instead.
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

    let observed: Element = overlay;
    let frame = 0;

    // Re-placing the overlay changes its size again, and changing an observed
    // size inside the observer's callback reports a ResizeObserver loop as a
    // window error. So re-place on the next frame, once per frame.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = overlayRef.current;

        // A `Portal` renders inline until its own effect finds its root, then
        // moves the overlay there as a new element (removing the old one
        // fires this observer): follow the element the ref holds now.
        if (current && current !== observed) {
          observer.unobserve(observed);
          observer.observe(current);
          observed = current;
        }

        onResize();
      });
    });

    observer.observe(overlay);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isOpen, overlayRef]);

  return position;
}
