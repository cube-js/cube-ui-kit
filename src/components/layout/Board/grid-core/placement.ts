/**
 * Placing items into a grid without dragging them there.
 *
 * A board's own gestures resolve placement through the compactor and the
 * collision resolver. An app that adds a widget programmatically — a toolbar
 * drop, a widget moved between boards by code, an "arrange these for me"
 * command — has to answer the same question with no gesture in hand, and had no
 * way to ask the engine for the answer. Left to solve it themselves, apps
 * re-implement the scan, and the same drop lands in two different cells
 * depending on whether a pointer or a code path served it.
 *
 * Original UI Kit code (not vendored from react-grid-layout).
 */

import { collides } from './collision';

import type { Layout, LayoutItem } from './types';

/**
 * The first position at or below the preferred cell where `item` fits without
 * overlapping any of `others` (which must themselves be overlap-free), scanning
 * left-to-right then top-to-bottom and never past `maxRows`; if the band below
 * is full, upward toward the top.
 *
 * This is the rule the board itself applies when it has to land a widget that
 * cannot stay where it was dropped, so using it for a programmatic add is what
 * makes the two agree.
 *
 * A finite `maxRows` mirrors the `gridBounds` constraint the normal landing path
 * applies (`clamp(y, 0, maxRows - h)`): the item's bottom edge stays within the
 * row limit even when the landing cell is blocked, so the downward scan cannot
 * push it off the board. If the whole valid band is full the item is clamped to
 * the limit — bounds win over overlap, exactly as `gridBounds` does. With an
 * unbounded `maxRows` there is always a free slot below every existing item, so
 * the downward scan terminates on its own.
 *
 * The returned item is a copy; `item` is not mutated. Its `w` is capped to
 * `cols`, and no other dimension is changed — this never resizes to fit.
 */
export function placeInFreeSlot(
  others: Layout,
  item: LayoutItem,
  cols: number,
  maxRows = Infinity,
): LayoutItem {
  const w = Math.min(item.w, cols);
  const maxY = Number.isFinite(maxRows)
    ? Math.max(0, maxRows - item.h)
    : Infinity;
  const fits = (x: number, y: number) =>
    !others.some((o) => collides(o, { ...item, x, y, w }));
  const preferX = Math.min(Math.max(0, item.x), cols - w);
  const startY = Math.min(Math.max(0, item.y), maxY);
  if (fits(preferX, startY)) return { ...item, x: preferX, y: startY, w };
  const scanBottom = Number.isFinite(maxRows)
    ? maxY
    : startY + others.reduce((m, o) => Math.max(m, o.y + o.h), 0) + 1;
  for (let y = startY; y <= scanBottom; y++) {
    for (let x = 0; x <= cols - w; x++) {
      if (fits(x, y)) return { ...item, x, y, w };
    }
  }
  // The landing row (clamped to the limit) and everything below it were full;
  // look upward for a free slot still inside the board before giving up.
  for (let y = startY - 1; y >= 0; y--) {
    for (let x = 0; x <= cols - w; x++) {
      if (fits(x, y)) return { ...item, x, y, w };
    }
  }
  return { ...item, x: preferX, y: startY, w };
}

/**
 * Split `total` cells across `parts` groups as evenly as possible: each group
 * gets at least one, and the first `total % parts` groups get one extra so the
 * pieces sum to `total`. With more groups than cells every group still gets one
 * and the sum overflows, which the grid's own bounds then clip — the best
 * available answer when there is less than a cell to go round.
 */
function splitEvenly(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.max(1, Math.floor(total / parts));
  const remainder = base * parts >= total ? 0 : total - base * parts;
  return Array.from(
    { length: parts },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}

/**
 * Tile every item evenly across both axes of a `cols × rows` grid, keeping the
 * row structure the layout already has: items are grouped into visual rows by
 * their current `y`, `rows` is divided across those groups, and `cols` across
 * each group's members.
 *
 * So three items on one line become three equal full-height columns; move one
 * below and the top line becomes two half-width cells while the lower item
 * spans the full width at half height. Grouping by `y` rather than reflowing
 * from scratch is what makes the result recognisably the user's arrangement
 * instead of an arbitrary repack.
 *
 * A visual row holding more items than the grid is wide is wrapped into
 * sub-rows of at most `cols`, so nothing tiles past the right edge. That can
 * take the result past `rows`; the caller decides whether to grow the grid or
 * let its bounds clip.
 *
 * This is the one operation that deliberately GROWS items — every gesture-driven
 * path refuses to, because growing on a move is a surprise. Here it is the whole
 * point, which is why it is a call the app makes rather than a mode the board is
 * in. Returns new items in the input's order; the input is not mutated.
 */
export function distributeEvenly(
  layout: Layout,
  { cols, rows }: { cols: number; rows: number },
): LayoutItem[] {
  if (layout.length === 0) return [];

  const gridCols = Math.max(1, cols);
  const gridRows = Math.max(1, rows);

  const sorted = [...layout].sort((a, b) =>
    a.y !== b.y ? a.y - b.y : a.x - b.x,
  );

  const groups: LayoutItem[][] = [];
  let lastY: number | null = null;
  for (const item of sorted) {
    if (lastY === null || item.y !== lastY) {
      groups.push([]);
      lastY = item.y;
    }
    groups[groups.length - 1].push(item);
  }

  const rowGroups: LayoutItem[][] = [];
  for (const group of groups) {
    if (group.length <= gridCols) {
      rowGroups.push(group);
    } else {
      for (let i = 0; i < group.length; i += gridCols) {
        rowGroups.push(group.slice(i, i + gridCols));
      }
    }
  }

  const rowHeights = splitEvenly(gridRows, rowGroups.length);
  const placed = new Map<string, LayoutItem>();
  let y = 0;
  rowGroups.forEach((group, gi) => {
    const h = rowHeights[gi];
    const widths = splitEvenly(gridCols, group.length);
    let x = 0;
    group.forEach((item, ci) => {
      const w = widths[ci];
      placed.set(item.i, { ...item, x, y, w, h });
      x += w;
    });
    y += h;
  });

  // Emit in the caller's order, not the sort's: a layout is keyed by `i`, and
  // reordering it would churn every consumer that diffs the array positionally.
  return layout.map((item) => placed.get(item.i) ?? item);
}
