/**
 * Rigid multi-item movement.
 *
 * `moveElement` (see ./layout.ts) moves exactly one item and is free to displace
 * any other item — including one the caller also wanted to move — as a collision
 * victim. That makes it unusable for moving a *selection* as a block: the shape
 * of the group would be destroyed by the very collision resolution meant to make
 * room for it.
 *
 * `moveElements` moves a set of items rigidly instead. Every mover receives the
 * same `(dx, dy)`, so the group's shape is invariant *by construction* rather
 * than by repair.
 *
 * This module is UI-Kit-specific; it is not part of the vendored react-grid-layout
 * core (see ./NOTICE.md).
 */

import { collides, getFirstCollision } from './collision';
import { bottom, cloneLayout } from './layout';

import type { Compactor, Layout, LayoutItem, Mutable } from './types';

export interface MoveElementsOptions {
  /**
   * The board's compactor. Supplies `type`, `allowOverlap` and
   * `preventCollision` as one consistent unit, and performs the tidy-up pass —
   * taking it whole is what keeps this function from ever disagreeing with the
   * board about compaction mode.
   */
  compactor: Compactor;
  cols: number;
  /** @default Infinity */
  maxRows?: number;
}

export interface MoveElementsResult {
  layout: LayoutItem[];
  /** The delta actually applied, after clamping the group to the grid. */
  dx: number;
  dy: number;
  /**
   * Whether a valid arrangement was produced. `false` means the frame must be
   * discarded and the previous one kept — never partially applied, since a
   * partial delta is precisely what shears the group apart.
   */
  moved: boolean;
}

/** An item may be moved unless it is static and does not opt back in. */
function isMovable(item: LayoutItem): boolean {
  return !item.static || item.isDraggable === true;
}

/**
 * Move every item in `ids` by the same delta, resolving collisions with the
 * items that are *not* moving.
 *
 * Semantics, all deliberate:
 *
 * - **Group-clamped, not item-clamped.** The delta is clamped once against the
 *   whole group, so dragging into an edge parks the block against it. Clamping
 *   each item into bounds separately would collapse the group's shape the first
 *   time it touched a wall, and it would never recover.
 * - **All-or-nothing.** If the frame cannot be resolved, nothing moves.
 * - **Movers never collide with each other.** They keep their relative
 *   positions, so only mover↔non-mover and non-mover↔non-mover overlaps resolve.
 * - **A static item is never a mover**, matching `moveElement`'s own guard, and
 *   a mover can never displace a static item — that frame is rejected instead.
 *
 * Returns a new layout in the input's item order; the input is never mutated.
 */
export function moveElements(
  layout: Layout,
  ids: ReadonlySet<string>,
  dx: number,
  dy: number,
  options: MoveElementsOptions,
): MoveElementsResult {
  const { compactor, cols, maxRows = Infinity } = options;

  const working = cloneLayout(layout);
  const movers = working.filter((it) => ids.has(it.i) && isMovable(it));

  if (movers.length === 0) {
    return { layout: working, dx: 0, dy: 0, moved: false };
  }

  const moverIds = new Set(movers.map((it) => it.i));
  const others = working.filter((it) => !moverIds.has(it.i));

  // ---- Clamp the delta to the group ----------------------------------------
  //
  // The group can travel until its *first* item hits an edge. `Math.max` on the
  // upper bounds guards the degenerate case of an item wider/taller than the
  // grid, where the max would otherwise fall below the min and invert the range.
  let minDx = -Infinity;
  let maxDx = Infinity;
  let minDy = -Infinity;
  let maxDy = Infinity;

  for (const it of movers) {
    minDx = Math.max(minDx, -it.x);
    maxDx = Math.min(maxDx, cols - it.w - it.x);
    minDy = Math.max(minDy, -it.y);
    maxDy = Math.min(maxDy, maxRows - it.h - it.y);
  }
  maxDx = Math.max(minDx, maxDx);
  maxDy = Math.max(minDy, maxDy);

  // `|| 0` collapses `-0`, which `Math.max` produces whenever a mover sits at
  // coordinate 0. It compares equal to `0` but not under `Object.is`, and it
  // would otherwise be handed back to callers as a delta.
  const clampedDx = Math.min(Math.max(dx, minDx), maxDx) || 0;
  const clampedDy = Math.min(Math.max(dy, minDy), maxDy) || 0;

  for (const it of movers) {
    (it as Mutable<LayoutItem>).x = it.x + clampedDx;
    (it as Mutable<LayoutItem>).y = it.y + clampedDy;
  }

  const rejected: MoveElementsResult = {
    layout: cloneLayout(layout),
    dx: 0,
    dy: 0,
    moved: false,
  };

  if (!compactor.allowOverlap) {
    // A static non-mover cannot be pushed out of the way, so overlapping one is
    // never resolvable.
    for (const it of others) {
      if (it.static && getFirstCollision(movers, it)) {
        return rejected;
      }
    }

    if (compactor.preventCollision) {
      // `compact="free"` / legacy no-compaction with collisions prevented: the
      // group may only land where it fits outright.
      for (const it of movers) {
        if (getFirstCollision(others, it)) {
          return rejected;
        }
      }
    } else if (compactor.type === null && !pushOthersDown(movers, others)) {
      // Only when nothing else will: a compacting compactor resolves overlaps
      // itself (and floats items back up afterwards), so pre-pushing there just
      // shoves neighbours further than needed and makes the board look like it
      // is lagging a step behind the pointer.
      return rejected;
    }
  }

  // Compact exactly as the single-widget path does — the group is not held in
  // place. On a vertically-compacted board a lone widget can never be parked in
  // empty space, and a group must not be able to either: neighbours have to
  // close the gap the moment it opens, or the board reads as a step behind.
  const out = [...compactor.compact(working, cols)];

  return { layout: out, dx: clampedDx, dy: clampedDy, moved: true };
}

/**
 * Push every non-mover that overlaps the group (or another displaced item)
 * straight down until nothing overlaps.
 *
 * Down, always — even under horizontal compaction. Downward is the one direction
 * a grid always has room in, so the pass is guaranteed to terminate; the
 * compactor then re-packs along its own axis immediately afterwards. Pushing
 * sideways would need overflow wrapping here and could ping-pong an item between
 * two neighbours.
 *
 * Mutates `others` in place. Returns `false` if the cascade fails to settle,
 * which the caller turns into a rejected frame.
 */
function pushOthersDown(movers: LayoutItem[], others: LayoutItem[]): boolean {
  // Place one at a time, in reading order, against a set that starts as the
  // group. Each push moves an item strictly past a placed item's bottom edge, so
  // it advances monotonically and the loop is bounded by the stack height.
  const ordered = [...others].sort((a, b) =>
    a.y === b.y ? a.x - b.x : a.y - b.y,
  );
  const placed: LayoutItem[] = [...movers];
  const limit = bottom(movers) + bottom(others) + others.length + 1;

  for (const item of ordered) {
    if (item.static) {
      // Verified collision-free against the movers by the caller; other statics
      // are pre-existing and not ours to resolve.
      placed.push(item);
      continue;
    }

    let steps = 0;
    let shifted = true;

    while (shifted) {
      shifted = false;
      for (const other of placed) {
        if (collides(item, other)) {
          (item as Mutable<LayoutItem>).y = other.y + other.h;
          shifted = true;
        }
      }
      if (++steps > limit) {
        return false;
      }
    }

    placed.push(item);
  }

  return true;
}
