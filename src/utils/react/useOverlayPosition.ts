import { useEffect, useEffectEvent, useRef } from 'react';
// oxlint-disable-next-line no-restricted-imports -- this is the wrapper the restriction points to
import { useOverlayPosition as useAriaOverlayPosition } from 'react-aria';

import type { RefObject } from 'react';
import type { AriaPositionProps, PositionAria } from 'react-aria';

/**
 * The trigger's horizontal place an open overlay was last positioned against,
 * and the trigger's own place and width when it was measured.
 */
interface HorizontalAnchor {
  left: number;
  width: number;
  triggerLeft: number;
  triggerWidth: number;
}

/**
 * React Aria's `useOverlayPosition`, with two fixes for an overlay that stays
 * open while something changes size.
 *
 * **The overlay grows.** It is re-placed whenever it changes size while open:
 * a menu that gains an item, a list that filters, a calendar that shows a
 * sixth week. React Aria does observe the overlay's size, but it attaches that
 * observer only once, when the hook first runs, and only if the overlay is
 * already in the DOM then. A trigger that outlives its overlay (every kit
 * overlay but the tooltip) runs the hook before the overlay exists, so no
 * observer attached, and an open overlay that grew kept its old place, past
 * the edge of the screen. This observer attaches on every opening instead.
 *
 * **The trigger changes width.** An overlay placed above or below its trigger
 * keeps its horizontal place while the trigger resizes in place. A picker's
 * trigger shows its value, so picking inside the overlay resizes the trigger,
 * and React Aria re-places the overlay on every trigger resize: it slid
 * sideways under the pointer, and the next pick landed on whatever had slid
 * there. See `keepHorizontalPlace` for when the overlay still follows its
 * trigger. Every opening anchors to the trigger as it is then. An overlay
 * placed beside its trigger still moves, so a wider trigger does not cover it.
 */
export function useOverlayPosition(props: AriaPositionProps): PositionAria {
  const {
    overlayRef,
    isOpen = true,
    placement = 'bottom',
    getTargetRect,
  } = props;
  const anchorRef = useRef<HorizontalAnchor | null>(null);
  const isAboveOrBelow = /^(top|bottom)/.test(placement);

  const position = useAriaOverlayPosition({
    ...props,
    getTargetRect: isAboveOrBelow
      ? (target) => keepHorizontalPlace(target, anchorRef, getTargetRect)
      : getTargetRect,
  });

  const onResize = useEffectEvent(() => {
    position.updatePosition();
  });

  // Forget the place on close, so the next opening anchors afresh.
  useEffect(() => {
    if (!isOpen) anchorRef.current = null;
  }, [isOpen]);

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

/**
 * The trigger's rect for React Aria to place the overlay against: the
 * trigger's live vertical place, and a horizontal place that depends on how
 * the trigger changed since the last placement.
 *
 * - **Moved without resizing** (a reflow, a scroll with `keepOpenOnScroll`,
 *   CommandTextArea's zero-width caret anchor on every keystroke): the place
 *   moves by the same distance.
 * - **Resized in place**, with its start edge, end edge or middle where it
 *   was, as content that grew or shrank leaves it: the place stays. A layout
 *   change that resizes a trigger in place (a fluid field on a window resize)
 *   keeps it too, until the next opening.
 * - **Resized and moved at once** (a reflow of a fluid field): the place
 *   anchors to the trigger as it is now.
 */
function keepHorizontalPlace(
  target: Element,
  anchorRef: RefObject<HorizontalAnchor | null>,
  getTargetRect: AriaPositionProps['getTargetRect'],
): DOMRect {
  const trigger = getTargetRect?.(target) ?? target.getBoundingClientRect();
  const last = anchorRef.current;
  let left = trigger.left;
  let width = trigger.width;

  if (last && trigger.width === last.triggerWidth) {
    left = last.left + trigger.left - last.triggerLeft;
    width = last.width;
  } else if (last && isResizedInPlace(trigger, last)) {
    left = last.left;
    width = last.width;
  }

  anchorRef.current = {
    left,
    width,
    triggerLeft: trigger.left,
    triggerWidth: trigger.width,
  };

  return new DOMRect(left, trigger.top, width, trigger.height);
}

/** Whether the trigger's start edge, end edge or middle stayed within a pixel. */
function isResizedInPlace(
  trigger: { left: number; width: number },
  last: HorizontalAnchor,
): boolean {
  const shift = (ratio: number) =>
    Math.abs(
      trigger.left +
        trigger.width * ratio -
        (last.triggerLeft + last.triggerWidth * ratio),
    );

  return shift(0) <= 1 || shift(1) <= 1 || shift(0.5) <= 1;
}
