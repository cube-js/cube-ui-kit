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

export interface IndicatorStyle {
  left: number;
  width: number;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to track and animate tab indicator position.
 *
 * Calculates the position and width of the selection indicator
 * based on the currently selected tab. Returns null if disabled
 * (e.g., for non-default tab types).
 *
 * @param containerRef - Ref to the tab container element
 * @param selectedKey - Currently selected tab key
 * @param enabled - Whether the indicator should be shown
 * @returns Indicator style (left, width) or null if disabled/not ready
 */
export function useTabIndicator(
  containerRef: RefObject<HTMLElement | null>,
  selectedKey: Key | null,
  enabled: boolean,
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

    // Only update if dimensions are valid (element has been painted)
    if (tabRect.width > 0) {
      setStyle({
        left:
          tabRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [containerRef, selectedKey, enabled]);

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

  return enabled ? style : null;
}
