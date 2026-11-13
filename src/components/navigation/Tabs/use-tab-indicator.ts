import { useEffectEvent, useState } from 'react';

import { getLayoutScale } from '../../../utils/layout-scale';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';

import type { Key } from '@react-types/shared';

// =============================================================================
// Types
// =============================================================================

/**
 * Axis-agnostic indicator geometry.
 * For horizontal orientation: `start` is `left`, `size` is `width`.
 * For vertical   orientation: `start` is `top`,  `size` is `height`.
 */
export interface IndicatorStyle {
  start: number;
  size: number;
}

export type IndicatorOrientation = 'horizontal' | 'vertical';

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to track and animate tab indicator position.
 *
 * Calculates the start position and size of the selection indicator
 * along the orientation axis. Returns null if disabled (e.g., for
 * non-default/narrow tab types).
 *
 * @param container - The tab list element. An element rather than a ref, so a
 *   list that is replaced by a new one is watched in its place.
 * @param selectedKey - Currently selected tab key
 * @param enabled - Whether the indicator should be shown
 * @param orientation - Axis along which the indicator moves
 * @param orderToken - Optional token that changes when tab order changes (triggers recalculation)
 * @returns Indicator style (`start`, `size`) or null if disabled/not ready
 */
export function useTabIndicator(
  container: HTMLElement | null,
  selectedKey: Key | null,
  enabled: boolean,
  orientation: IndicatorOrientation = 'horizontal',
  orderToken?: string,
): IndicatorStyle | null {
  const [style, setStyle] = useState<IndicatorStyle | null>(null);

  // Forget the place while off: the selection may change meanwhile, and the
  // indicator must not reappear under the old tab before it is measured.
  if (!enabled && style) setStyle(null);

  const measure = useEffectEvent((container: HTMLElement) => {
    const selectedTab = container.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );

    if (selectedKey == null || !selectedTab) {
      setStyle(null);
      return;
    }

    const isVertical = orientation === 'vertical';
    const containerRect = container.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();
    const tabSize = isVertical ? tabRect.height : tabRect.width;

    // Only update if dimensions are valid (element has been painted)
    if (tabSize <= 0) return;

    // Rects are in screen pixels; the indicator is laid out in the list's own.
    const scale = getLayoutScale(container, orientation);
    const offset = isVertical
      ? tabRect.top - containerRect.top
      : tabRect.left - containerRect.left;
    const scroll = isVertical ? container.scrollTop : container.scrollLeft;
    const start = offset / scale + scroll;
    const size = tabSize / scale;

    // Most reports leave the selected tab where it was (a tab after it, the
    // list's other axis), so keep the same object then.
    setStyle((prev) =>
      prev?.start === start && prev.size === size ? prev : { start, size },
    );
  });

  // The selected tab's place depends on the list's size and on the size and
  // order of every tab in it. So measure whenever one of them changes: a title
  // that loads after the tab is selected, a renamed tab, a tab before it that
  // grows, the list becoming visible. A new selection or tab order observes
  // afresh, and the observer's first report measures it.
  useLayoutEffect(() => {
    if (!enabled || !container) return;

    const observer = new ResizeObserver(() => measure(container));

    // The border box, so the list's own padding, which moves every tab, counts.
    observer.observe(container, { box: 'border-box' });

    for (const child of container.children) {
      // Skip the indicator, the one child without a tab: its own transition
      // moves nothing.
      if (child.querySelector('[role="tab"]')) observer.observe(child);
    }

    return () => observer.disconnect();
  }, [container, enabled, orientation, selectedKey, orderToken]);

  return enabled ? style : null;
}
