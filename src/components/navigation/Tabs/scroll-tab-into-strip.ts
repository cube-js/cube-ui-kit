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
