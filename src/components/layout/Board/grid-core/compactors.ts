/**
 * Compactor implementations.
 *
 * Vendored from react-grid-layout v2 (`src/core/compactors.ts`).
 * See ./NOTICE.md for attribution and license.
 *
 * Compactors are pluggable strategies for removing gaps between grid items.
 */

import { collides, getFirstCollision } from './collision';
import { bottom, cloneLayout, cloneLayoutItem, getStatics } from './layout';
import { sortLayoutItemsByColRow, sortLayoutItemsByRowCol } from './sort';

import type {
  Compactor,
  CompactType,
  Layout,
  LayoutItem,
  Mutable,
} from './types';

// ============================================================================
// Helpers for Custom Compactors
// ============================================================================

/**
 * Resolve a compaction collision by moving items.
 *
 * Before moving an item to a position, checks if that movement would cause
 * collisions and recursively moves those items first.
 */
export function resolveCompactionCollision(
  layout: Layout,
  item: LayoutItem,
  moveToCoord: number,
  axis: 'x' | 'y',
  hasStatics?: boolean,
): void {
  const sizeProp = axis === 'x' ? 'w' : 'h';

  // Temporarily increment position to check for collisions
  (item as Mutable<LayoutItem>)[axis] += 1;

  const itemIndex = layout.findIndex((l) => l.i === item.i);

  const layoutHasStatics = hasStatics ?? getStatics(layout).length > 0;

  for (let i = itemIndex + 1; i < layout.length; i++) {
    const otherItem = layout[i];
    if (otherItem === undefined) continue;
    if (otherItem.static) continue;
    // Optimization: break early if past this element, but only if no statics
    // are present. Static items can be scattered throughout the layout.
    if (!layoutHasStatics && otherItem.y > item.y + item.h) break;

    if (collides(item, otherItem)) {
      resolveCompactionCollision(
        layout,
        otherItem,
        moveToCoord + item[sizeProp],
        axis,
        layoutHasStatics,
      );
    }
  }

  (item as Mutable<LayoutItem>)[axis] = moveToCoord;
}

/** Compact a single item vertically (move up). Mutates `l`. */
export function compactItemVertical(
  compareWith: Layout,
  l: LayoutItem,
  fullLayout: Layout,
  maxY: number,
): LayoutItem {
  // Correct negative positions first
  (l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
  (l as Mutable<LayoutItem>).y = Math.max(l.y, 0);

  // Limit Y to the current bottom
  (l as Mutable<LayoutItem>).y = Math.min(maxY, l.y);

  // Move up as far as possible
  while (l.y > 0 && !getFirstCollision(compareWith, l)) {
    (l as Mutable<LayoutItem>).y--;
  }

  // Resolve collisions by moving down
  let collision: LayoutItem | undefined;
  while ((collision = getFirstCollision(compareWith, l)) !== undefined) {
    resolveCompactionCollision(fullLayout, l, collision.y + collision.h, 'y');
  }

  (l as Mutable<LayoutItem>).y = Math.max(l.y, 0);
  return l;
}

/** Compact a single item horizontally (move left). Mutates `l`. */
export function compactItemHorizontal(
  compareWith: Layout,
  l: LayoutItem,
  cols: number,
  fullLayout: Layout,
): LayoutItem {
  // Correct negative positions first
  (l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
  (l as Mutable<LayoutItem>).y = Math.max(l.y, 0);

  // Move left as far as possible
  while (l.x > 0 && !getFirstCollision(compareWith, l)) {
    (l as Mutable<LayoutItem>).x--;
  }

  // Resolve collisions
  let collision: LayoutItem | undefined;
  while ((collision = getFirstCollision(compareWith, l)) !== undefined) {
    resolveCompactionCollision(fullLayout, l, collision.x + collision.w, 'x');

    // Horizontal overflow: wrap to next row
    if (l.x + l.w > cols) {
      (l as Mutable<LayoutItem>).x = cols - l.w;
      (l as Mutable<LayoutItem>).y++;

      while (l.x > 0 && !getFirstCollision(compareWith, l)) {
        (l as Mutable<LayoutItem>).x--;
      }
    }
  }

  (l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
  return l;
}

// ============================================================================
// Vertical Compactor
// ============================================================================

/**
 * Vertical compactor - moves items up to fill gaps. Default compaction mode.
 */
export const verticalCompactor: Compactor = {
  type: 'vertical',
  allowOverlap: false,

  compact(layout: Layout, _cols: number): Layout {
    const compareWith = getStatics(layout);
    let maxY = bottom(compareWith);
    const sorted = sortLayoutItemsByRowCol(layout);
    const out: LayoutItem[] = new Array(layout.length);

    for (let i = 0; i < sorted.length; i++) {
      const sortedItem = sorted[i];
      if (sortedItem === undefined) continue;

      let l = cloneLayoutItem(sortedItem);

      if (!l.static) {
        l = compactItemVertical(compareWith, l, sorted, maxY);
        maxY = Math.max(maxY, l.y + l.h);
        compareWith.push(l);
      }

      const originalIndex = layout.indexOf(sortedItem);
      out[originalIndex] = l;
      l.moved = false;
    }

    return out;
  },
};

// ============================================================================
// Horizontal Compactor
// ============================================================================

/**
 * Horizontal compactor - moves items left to fill gaps.
 */
export const horizontalCompactor: Compactor = {
  type: 'horizontal',
  allowOverlap: false,

  compact(layout: Layout, cols: number): Layout {
    const compareWith = getStatics(layout);
    const sorted = sortLayoutItemsByColRow(layout);
    const out: LayoutItem[] = new Array(layout.length);

    for (let i = 0; i < sorted.length; i++) {
      const sortedItem = sorted[i];
      if (sortedItem === undefined) continue;

      let l = cloneLayoutItem(sortedItem);

      if (!l.static) {
        l = compactItemHorizontal(compareWith, l, cols, sorted);
        compareWith.push(l);
      }

      const originalIndex = layout.indexOf(sortedItem);
      out[originalIndex] = l;
      l.moved = false;
    }

    return out;
  },
};

// ============================================================================
// No Compaction
// ============================================================================

/**
 * No compaction - items stay where placed (free-form layouts).
 */
export const noCompactor: Compactor = {
  type: null,
  allowOverlap: false,

  compact(layout: Layout, _cols: number): Layout {
    return cloneLayout(layout);
  },
};

// ============================================================================
// Overlap-Allowing Variants
// ============================================================================

/** Vertical compactor that allows overlapping items. */
export const verticalOverlapCompactor: Compactor = {
  ...verticalCompactor,
  allowOverlap: true,

  compact(layout: Layout, _cols: number): Layout {
    return cloneLayout(layout);
  },
};

/** Horizontal compactor that allows overlapping items. */
export const horizontalOverlapCompactor: Compactor = {
  ...horizontalCompactor,
  allowOverlap: true,

  compact(layout: Layout, _cols: number): Layout {
    return cloneLayout(layout);
  },
};

/** No compaction, with overlapping allowed. */
export const noOverlapCompactor: Compactor = {
  ...noCompactor,
  allowOverlap: true,
};

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get a compactor by type (convenience for the string-based compactType API).
 */
export function getCompactor(
  compactType: CompactType,
  allowOverlap: boolean = false,
  preventCollision: boolean = false,
): Compactor {
  let baseCompactor: Compactor;

  if (allowOverlap) {
    if (compactType === 'vertical') baseCompactor = verticalOverlapCompactor;
    else if (compactType === 'horizontal')
      baseCompactor = horizontalOverlapCompactor;
    else baseCompactor = noOverlapCompactor;
  } else {
    if (compactType === 'vertical') baseCompactor = verticalCompactor;
    else if (compactType === 'horizontal') baseCompactor = horizontalCompactor;
    // For 'wrap' and null, use noCompactor
    else baseCompactor = noCompactor;
  }

  if (preventCollision) {
    return { ...baseCompactor, preventCollision };
  }
  return baseCompactor;
}
