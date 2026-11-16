import { getLayoutScale } from '../../../utils/layout-scale';

import type { TabPlacement } from './types';

/**
 * Scroll the tab strip, and only the strip, so the tab is fully inside it.
 * Unlike `scrollIntoView` this never scrolls the page or any other ancestor: a
 * tab becoming active or changing size moves the strip alone, so a page with
 * the strip below the fold stays where the user left it.
 */
export function scrollTabIntoStrip(tab: HTMLElement, placement: TabPlacement) {
  const strip = tab.closest<HTMLElement>('[data-element="Scroll"]');

  if (!strip) return;

  const isVertical = placement === 'left' || placement === 'right';
  const stripRect = strip.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const start = isVertical
    ? tabRect.top - stripRect.top
    : tabRect.left - stripRect.left;
  const end = isVertical
    ? tabRect.bottom - stripRect.bottom
    : tabRect.right - stripRect.right;

  // `nearest`: the smallest move that shows the tab, favouring its start when
  // it is longer than the strip.
  const delta = start < 0 ? start : end > 0 ? Math.min(end, start) : 0;

  if (!delta) return;

  // `delta` is in screen pixels; the strip scrolls in its own.
  const scroll =
    delta / getLayoutScale(strip, isVertical ? 'vertical' : 'horizontal');

  if (isVertical) strip.scrollTop += scroll;
  else strip.scrollLeft += scroll;
}

/**
 * Events on the tab bar that mean the user has taken over the strip's scroll
 * position. Listened for on the whole `Bar`, not just the `Scroll` element: the
 * custom scrollbar and the scroll arrows sit outside it.
 */
const STRIP_INTERACTION_EVENTS = [
  'wheel',
  'pointerdown',
  'touchstart',
  'keydown',
] as const;

/**
 * Keep a tab in the strip while it settles: `keep` runs on each of the tab's own
 * size changes (and once as observing starts), until the user first interacts
 * with the tab bar (wheel, pointer, touch or a key). From then on the strip
 * stays where they left it. Keyed off interaction events, not `scroll`: the
 * re-scroll fires `scroll` too. Returns the function that stops following.
 */
export function followTabInStrip(tab: HTMLElement, keep: () => void) {
  if (typeof ResizeObserver === 'undefined') return () => {};

  const bar = tab.closest<HTMLElement>('[data-element="Bar"]');
  const observer = new ResizeObserver(keep);
  const stopFollowing = () => {
    observer.disconnect();

    for (const type of STRIP_INTERACTION_EVENTS) {
      bar?.removeEventListener(type, stopFollowing, true);
    }
  };

  observer.observe(tab);

  for (const type of STRIP_INTERACTION_EVENTS) {
    // Capture: a tab's own handlers may stop these from bubbling.
    bar?.addEventListener(type, stopFollowing, {
      capture: true,
      passive: true,
    });
  }

  return stopFollowing;
}
