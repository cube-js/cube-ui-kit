/**
 * Sorting utilities for grid layouts.
 *
 * Vendored from react-grid-layout v2 (`src/core/sort.ts`).
 * See ./NOTICE.md for attribution and license.
 */

import type { CompactType, Layout, LayoutItem } from './types';

/**
 * Sort layout items based on the compaction type.
 *
 * - Vertical compaction: sort by row (y) then column (x)
 * - Horizontal compaction: sort by column (x) then row (y)
 * - No compaction (null): return original order
 */
export function sortLayoutItems(
  layout: Layout,
  compactType: CompactType,
): LayoutItem[] {
  if (compactType === 'horizontal') {
    return sortLayoutItemsByColRow(layout);
  }
  if (compactType === 'vertical') {
    return sortLayoutItemsByRowCol(layout);
  }
  if (compactType === 'wrap') {
    // Wrap mode uses row-col order (reading order: left-to-right, top-to-bottom)
    return sortLayoutItemsByRowCol(layout);
  }
  // No compaction - return a copy to maintain immutability
  return [...layout];
}

/**
 * Sort layout items by row ascending, then column ascending.
 */
export function sortLayoutItemsByRowCol(layout: Layout): LayoutItem[] {
  return [...layout].sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}

/**
 * Sort layout items by column ascending, then row ascending.
 */
export function sortLayoutItemsByColRow(layout: Layout): LayoutItem[] {
  return [...layout].sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });
}
