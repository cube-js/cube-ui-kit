/**
 * Collision resolution strategies for a grid that prevents collisions.
 *
 * Original UI Kit code (not vendored from react-grid-layout): the upstream
 * engine only ever reverts a blocked move.
 *
 * When `preventCollision` is on, `moveElement` refuses any placement that
 * overlaps an existing item and snaps the dragged item back. That is the right
 * default, but a free grid often wants the placement *resolved* instead of
 * refused - shrunk into whatever room is actually there, or exchanged with the
 * widget already sitting in the target slot. These strategies produce such a
 * resolution, and every resolution they return is overlap-free, so the caller's
 * own overlap guards keep working unchanged.
 */

import { collides } from './collision';

import type {
  CollisionMode,
  CollisionResolver,
  CollisionResolverOptions,
  Layout,
  LayoutItem,
} from './types';

/** Whether a single grid cell is free of every item in `others`. */
function cellFree(others: Layout, x: number, y: number): boolean {
  for (let i = 0; i < others.length; i++) {
    const o = others[i];
    if (
      o !== undefined &&
      x >= o.x &&
      x < o.x + o.w &&
      y >= o.y &&
      y < o.y + o.h
    ) {
      return false;
    }
  }
  return true;
}

/**
 * The largest rectangle anchored at `anchor` that fits without overlapping
 * `others`, growing rightward and downward only.
 *
 * Never larger than `desired` (a drag must never *upscale* a widget - growing
 * things is an explicit, opt-in operation like "distribute evenly", not a side
 * effect of moving them), never smaller than the item's own `minW`/`minH`, and
 * never past `cols` / `maxRows`. Among the candidates the largest-area rectangle
 * wins, breaking ties on width: a grid is read left to right, so a wide-and-flat
 * result is the less surprising of two equal-area fits.
 *
 * Returns `null` when not even the minimum size fits, which the callers treat as
 * "no resolution" and fall back to reverting.
 */
export function maxFreeRectAt(
  others: Layout,
  anchor: { x: number; y: number },
  desired: { w: number; h: number },
  limits: { cols: number; maxRows?: number },
  mins?: { minW?: number; minH?: number },
): { w: number; h: number } | null {
  if (anchor.x < 0 || anchor.y < 0) return null;

  const minW = Math.max(1, mins?.minW ?? 1);
  const minH = Math.max(1, mins?.minH ?? 1);
  const maxRows = limits.maxRows ?? Infinity;
  const maxW = Math.min(desired.w, limits.cols - anchor.x);
  const maxH = Math.min(
    desired.h,
    Number.isFinite(maxRows) ? maxRows - anchor.y : desired.h,
  );

  if (maxW < minW || maxH < minH) return null;

  // Free height available in each column of the candidate band, measured down
  // from the anchor row and capped at the tallest useful height.
  const free: number[] = [];
  for (let dx = 0; dx < maxW; dx++) {
    let h = 0;
    while (h < maxH && cellFree(others, anchor.x + dx, anchor.y + h)) h++;
    free.push(h);
    // A column with no room at all caps every wider candidate, so stop early.
    if (h === 0) break;
  }

  let best: { w: number; h: number } | null = null;
  let bestArea = 0;
  let limit = maxH;
  for (let w = 1; w <= free.length; w++) {
    limit = Math.min(limit, free[w - 1]!);
    if (limit < minH) break;
    if (w < minW) continue;
    const area = w * limit;
    // `>=` so the widest of several equal-area fits wins: `w` only grows here, so
    // the last match is the widest one.
    if (area >= bestArea) {
      best = { w, h: limit };
      bestArea = area;
    }
  }

  return best;
}

/**
 * Shrink the placement to the room actually available at the cell it was
 * dropped on.
 */
function downscaleInPlace(
  layout: Layout,
  item: LayoutItem,
  others: Layout,
  desired: { w: number; h: number },
  limits: { cols: number; maxRows?: number },
): LayoutItem[] | null {
  const fit = maxFreeRectAt(
    others,
    { x: item.x, y: item.y },
    desired,
    limits,
    item,
  );
  if (!fit) return null;
  // Nothing to resolve: the requested size already fits, so the collision was
  // not a sizing problem and reverting is still the honest answer.
  if (fit.w === item.w && fit.h === item.h) return null;

  return layout.map((l) =>
    l.i === item.i ? { ...l, w: fit.w, h: fit.h, moved: true } : l,
  );
}

/** Number of cells two items share. Zero when they do not overlap at all. */
function overlapArea(a: LayoutItem, b: LayoutItem): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Exchange the placement with one of the widgets under it.
 *
 * The dragged widget takes the other's cell and the other takes the cell the
 * dragged widget came from. Each keeps as much of its own size as fits there -
 * that cell plus any free space adjacent to it - and neither ever grows.
 *
 * `from` is whatever the caller's layout says, so it is the caller that decides
 * what "came from" means. A pointer drag resolves every frame against the
 * arrangement the gesture started with, making it the cell the drag began at, and
 * keeping the result a pure function of where the pointer is; chaining frames off
 * each other instead would exchange with every widget swept over.
 * The slot the dragged widget is leaving is reserved for the displaced widget
 * while the dragged one is sized, so the two can never claim the same cells: the
 * result is overlap-free by construction, not by a follow-up check.
 */
function exchangeWithCollision(
  layout: Layout,
  item: LayoutItem,
  collisions: LayoutItem[],
  from: { x: number; y: number },
  desired: { w: number; h: number },
  limits: { cols: number; maxRows?: number },
): LayoutItem[] | null {
  // Nothing to trade if the widget has not actually left a slot behind - a
  // cross-board drop, where it never had one on this board.
  if (from.x === item.x && from.y === item.y) return null;

  // A drop that spans a boundary covers two widgets at once, and refusing those
  // frames would leave a band mid-drag where nothing is swapped at all: the
  // placeholder snaps back to the origin, then jumps to the far swap once the drop
  // clears the first widget. Trade with the one the drop covers most instead, so
  // the swap only ever changes which partner it is - never blinks away. Ties go to
  // the widget earlier in reading order, so the choice is deterministic. Exactly
  // one widget is ever displaced, whichever is picked.
  const candidates = collisions
    .filter((c) => !c.static)
    .map((c) => ({ c, area: overlapArea(item, c) }))
    .sort((p, q) => q.area - p.area || p.c.y - q.c.y || p.c.x - q.c.x)
    .map(({ c }) => c);

  for (const other of candidates) {
    const exchanged = exchangeWith(layout, item, other, from, desired, limits);
    if (exchanged) return exchanged;
  }
  return null;
}

/** One concrete two-widget exchange, or `null` if either side cannot fit. */
function exchangeWith(
  layout: Layout,
  item: LayoutItem,
  other: LayoutItem,
  from: { x: number; y: number },
  desired: { w: number; h: number },
  limits: { cols: number; maxRows?: number },
): LayoutItem[] | null {
  const rest = layout.filter((l) => l.i !== item.i && l.i !== other.i);
  // The slot being vacated, held back so the dragged widget cannot grow into the
  // space the displaced one is about to need. Ids are never compared here (the
  // scan works cell by cell), so this placeholder cannot clash with a real one.
  const originSlot: LayoutItem = {
    i: 'origin-slot-reservation',
    x: from.x,
    y: from.y,
    w: desired.w,
    h: desired.h,
  };

  const movedFit = maxFreeRectAt(
    [...rest, originSlot],
    { x: other.x, y: other.y },
    desired,
    limits,
    item,
  );
  if (!movedFit) return null;
  const moved: LayoutItem = {
    ...item,
    x: other.x,
    y: other.y,
    w: movedFit.w,
    h: movedFit.h,
    moved: true,
  };

  const displacedFit = maxFreeRectAt(
    [...rest, moved],
    { x: from.x, y: from.y },
    { w: other.w, h: other.h },
    limits,
    other,
  );
  if (!displacedFit) return null;
  const displaced: LayoutItem = {
    ...other,
    x: from.x,
    y: from.y,
    w: displacedFit.w,
    h: displacedFit.h,
    moved: true,
  };

  return layout.map((l) =>
    l.i === item.i ? moved : l.i === other.i ? displaced : l,
  );
}

/**
 * Build the resolver `moveElement` consults instead of reverting a blocked move,
 * or `undefined` for `'revert'` (and for an unset mode), which keeps the engine
 * on its original path with no added work.
 *
 * For an in-board drag, `'swap'` is an escalation ladder: exchange with one of
 * the widgets under the drop, else downscale at the drop cell, else revert. A
 * dense grid stays draggable that way - refusing everything that is not a clean
 * one-to-one trade would make the mode feel broken exactly where it is needed.
 * Cross-board callers pass `allowExchange: false`, which turns the same mode into
 * downscaling at the drop cell - there is no slot on the destination to trade
 * back, and a transfer that cannot resolve is placed in a free cell rather than
 * refused, since a widget dropped somewhere has to end up somewhere.
 */
export function createCollisionResolver(
  mode: CollisionMode | undefined,
  options: CollisionResolverOptions,
): CollisionResolver | undefined {
  if (!mode || mode === 'revert') return undefined;

  const limits = { cols: options.cols, maxRows: options.maxRows };

  return ({ layout, item, collisions, from }) => {
    const others = layout.filter((l) => l.i !== item.i);
    const desired = options.desired ?? { w: item.w, h: item.h };

    if (mode === 'swap' && options.allowExchange !== false) {
      const exchanged = exchangeWithCollision(
        layout,
        item,
        collisions,
        from,
        desired,
        limits,
      );
      if (exchanged) return exchanged;
    }

    return downscaleInPlace(layout, item, others, desired, limits);
  };
}

/**
 * Whether a layout holds no overlapping pair. A resolution is only ever accepted
 * when this holds, so the specs assert it directly.
 */
export function isOverlapFree(layout: Layout): boolean {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (collides(layout[i]!, layout[j]!)) return false;
    }
  }
  return true;
}
