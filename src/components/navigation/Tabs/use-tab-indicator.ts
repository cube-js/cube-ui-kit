import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { chainRaf } from '../../../utils/raf';

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
 * @param containerRef - Ref to the tab container element
 * @param selectedKey - Currently selected tab key
 * @param enabled - Whether the indicator should be shown
 * @param orientation - Axis along which the indicator moves
 * @param orderToken - Optional token that changes when tab order changes (triggers recalculation)
 * @returns Indicator style (`start`, `size`) or null if disabled/not ready
 */
export function useTabIndicator(
  containerRef: RefObject<HTMLElement | null>,
  selectedKey: Key | null,
  enabled: boolean,
  orientation: IndicatorOrientation = 'horizontal',
  orderToken?: string,
): IndicatorStyle | null {
  const [style, setStyle] = useState<IndicatorStyle | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const updateIndicator = useCallback(() => {
    if (!enabled || !containerRef.current || selectedKey == null) {
      setStyle(null);
      return;
    }

    // Find the selected tab button within the container
    const selectedTab = containerRef.current.querySelector(
      '[aria-selected="true"]',
    ) as HTMLElement | null;

    if (!selectedTab) {
      setStyle(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();

    if (orientation === 'vertical') {
      // Only update if dimensions are valid (element has been painted)
      if (tabRect.height > 0) {
        setStyle({
          start:
            tabRect.top - containerRect.top + containerRef.current.scrollTop,
          size: tabRect.height,
        });
      }
    } else {
      if (tabRect.width > 0) {
        setStyle({
          start:
            tabRect.left - containerRect.left + containerRef.current.scrollLeft,
          size: tabRect.width,
        });
      }
    }
  }, [containerRef, selectedKey, enabled, orientation, orderToken]);

  // Update on selectedKey change - use chainRaf to ensure DOM is fully painted
  useLayoutEffect(() => {
    // Cancel any pending RAF chain
    if (cancelRef.current) {
      cancelRef.current();
    }

    // Schedule update after 2 frames to ensure layout is complete
    cancelRef.current = chainRaf(() => {
      updateIndicator();
    }, 2);

    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [updateIndicator]);

  // Update on window resize
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => updateIndicator();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, updateIndicator]);

  // Recalculate when container becomes visible (0 -> non-zero size along the axis)
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const getAxisSize = (rect: { width: number; height: number }) =>
      orientation === 'vertical' ? rect.height : rect.width;

    let prevSize = getAxisSize(container.getBoundingClientRect());

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newSize = getAxisSize(entry.contentRect);

      if (prevSize === 0 && newSize > 0) {
        updateIndicator();
      }

      prevSize = newSize;
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [enabled, orientation, updateIndicator]);

  return enabled ? style : null;
}
