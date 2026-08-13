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
 * than by repair — and the compaction that follows both orders and places the
 * group as one block, so it cannot undo that (see `compactWithGroupOrder`).
 *
 * This module is UI-Kit-specific; it is not part of the vendored react-grid-layout
 * core (see ./NOTICE.md).
 */

import { collides, getFirstCollision } from './collision';
import { compactItemHorizontal, compactItemVertical } from './compactors';
import { bottom, cloneLayout, cloneLayoutItem, getStatics } from './layout';
import { sortLayoutItemsByColRow, sortLayoutItemsByRowCol } from './sort';

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
 * - **Gravity still wins, but it cannot reach inside the group.** A compacting
 *   board floats the block along with everyone else, so it is not held in
 *   mid-air; it just floats as *one rigid unit*, which is what stops a
 *   displaced neighbour being packed between two members or one member being
 *   floated out from under another.
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

  // The axis the board compacts along; `null` has none, but its pre-push has to
  // pick a direction and down is the one a grid always has room in.
  const axis: 'x' | 'y' = compactor.type === 'horizontal' ? 'x' : 'y';
  const travel = axis === 'x' ? clampedDx : clampedDy;

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
    } else if (
      compactor.type === null ||
      ((compactor.type === 'vertical' || compactor.type === 'horizontal') &&
        travel < 0)
    ) {
      // Nothing else will resolve it:
      //
      // - `type === null` has no compaction pass at all.
      // - Moving *against* gravity, the group is claiming ground the widgets it
      //   passed are still standing on. Compaction alone cannot do this: it
      //   places items in `head` order, so a non-mover sitting even one row
      //   above the group's landing row is placed first and then blocks it —
      //   the group stops short (or does not move at all) while the widgets it
      //   did overlap slide down, which is exactly the "only some of them
      //   moved" symptom. Displacing them first is what the single-widget path
      //   does too (`moveElementAwayFromCollision` runs before compaction),
      //   and it costs nothing extra: `compactWithGroupOrder` reads each unit's
      //   `head` from these updated coordinates, so the pushed items sort after
      //   the group and gravity floats them straight back to their minimal
      //   positions in the same frame.
      //
      // Moving *with* gravity needs the opposite: the non-movers must claim the
      // vacated rows first, or the group lands back where it started and the
      // drag reads as a no-op.
      if (!displaceOthers(movers, others, axis)) {
        return rejected;
      }
    }
  }

  // Compact exactly as the single-widget path does — the group is not held in
  // place. On a vertically-compacted board a lone widget can never be parked in
  // empty space, and a group must not be able to either: neighbours have to
  // close the gap the moment it opens, or the board reads as a step behind.
  //
  // But the group is placed as *one block*. A plain compaction sorts every item
  // by `(y, x)` and packs each one independently, with no idea a group exists —
  // so a displaced neighbour gets packed between two members, or one member
  // floats out from under another and the selection comes apart mid-drag. Check
  // `allowOverlap` first: the overlap compactors report a `type` but their
  // `compact` is a plain clone, so there is nothing to order.
  const groupAware =
    !compactor.allowOverlap &&
    (compactor.type === 'vertical' || compactor.type === 'horizontal');

  const out = groupAware
    ? compactWithGroupOrder(working, moverIds, {
        axis: compactor.type as CompactionAxis,
        travel,
        cols,
      })
    : [...compactor.compact(working, cols)];

  return { layout: out, dx: clampedDx, dy: clampedDy, moved: true };
}

type CompactionAxis = 'vertical' | 'horizontal';

interface GroupOrderOptions {
  /** The axis the board compacts along. */
  axis: CompactionAxis;
  /**
   * The group's clamped travel along that axis. Only the sign is read — it
   * decides who wins a tie for the same row (or column).
   */
  travel: number;
  cols: number;
}

/** A group of movers, or a single non-mover, as one thing to place. */
interface CompactionUnit {
  isGroup: boolean;
  /** Leading edge along the compaction axis. */
  head: number;
  /** Leading edge across it, among the members sitting at `head`. */
  cross: number;
  members: LayoutItem[];
  /**
   * Where the members sat before *anything* was placed, in `members` order.
   *
   * The group's shape has to be read from here rather than from the live items:
   * packing a non-mover runs `resolveCompactionCollision`, which shoves items
   * later in the placement order out of its way — and for any drag where the
   * group is placed after a non-mover, that cascade reaches inside the group and
   * moves one member without the others. Left alone it would be baked into the
   * block as if it were the shape the user is holding, and two members can end
   * up on top of each other.
   */
  origin?: Array<{ x: number; y: number }>;
}

/**
 * Compact a layout the way the board's own compactor would, except that the
 * movers are placed as one rigid block instead of being packed one by one by a
 * global `(y, x)` sort.
 *
 * The block still floats under gravity — it is never parked in mid-air — but it
 * floats as a unit: one shift is applied to every member, so relative offsets
 * are invariant for the whole drag. Nothing can be packed between two members,
 * and no member can float out from under another.
 *
 * The cost, deliberately accepted: a *ragged* group (one whose members could
 * individually float further) is no longer a fixed point of the plain compactor,
 * so the drop — which re-compacts the source board — settles it. Holding the
 * shape while the pointer is down is what the gesture is about; the resting
 * layout stays an ordinary compacted layout.
 *
 * Placement order decides everything, and it turns on the direction of travel:
 *
 * - Moving **against** gravity (`travel < 0`), the group claims the row it was
 *   dropped on and the widgets it passed fall in below it.
 * - Moving **with** gravity, the non-movers close the vacated space first.
 *   Handing the group the tie here would leave it exactly where it started and
 *   the drag would read as a no-op.
 *
 * The comparison is a strict `travel < 0`, so a zero-travel re-run lands in the
 * second branch — that is what makes the pass idempotent, which the live drag
 * and the keyboard path both depend on.
 */
function compactWithGroupOrder(
  layout: Layout,
  moverIds: ReadonlySet<string>,
  { axis, travel, cols }: GroupOrderOptions,
): LayoutItem[] {
  const horizontal = axis === 'horizontal';
  const head = horizontal ? 'x' : 'y';
  const cross = horizontal ? 'y' : 'x';
  const groupFirst = travel < 0;

  const clones = layout.map(cloneLayoutItem);
  const movers: LayoutItem[] = [];
  const units: CompactionUnit[] = [];

  for (const it of clones) {
    if (moverIds.has(it.i)) {
      movers.push(it);
    } else {
      units.push({
        isGroup: false,
        head: it[head],
        cross: it[cross],
        members: [it],
      });
    }
  }

  if (movers.length > 0) {
    const groupHead = Math.min(...movers.map((it) => it[head]));
    // Members are placed in the same reading order the compactor would have
    // used, so a block that has to fall back to item-by-item packing lands
    // exactly where it would have.
    const members = horizontal
      ? sortLayoutItemsByColRow(movers)
      : sortLayoutItemsByRowCol(movers);

    units.push({
      isGroup: true,
      head: groupHead,
      cross: Math.min(
        ...movers.filter((it) => it[head] === groupHead).map((it) => it[cross]),
      ),
      members,
      origin: members.map((it) => ({ x: it.x, y: it.y })),
    });
  }

  units.sort((a, b) => {
    if (a.head !== b.head) return a.head - b.head;
    // Same row: direction decides whether the group or the displaced non-movers
    // get first claim on it.
    if (a.isGroup !== b.isGroup) return a.isGroup === groupFirst ? -1 : 1;
    if (a.cross !== b.cross) return a.cross - b.cross;

    return 0;
  });

  // From here on this mirrors `verticalCompactor` / `horizontalCompactor`
  // exactly: statics seed the obstacle set and are never floated, every other
  // item is packed against what is already placed, and `maxY` tracks how far
  // down the board has filled. The one departure is a group of two or more,
  // which is floated as a block instead of item by item.
  const order = units.flatMap((unit) => unit.members);
  const compareWith = getStatics(clones);
  let maxY = bottom(compareWith);

  for (const unit of units) {
    const asBlock =
      unit.isGroup &&
      unit.members.length > 1 &&
      unit.origin !== undefined &&
      placeBlock(compareWith, unit.members, unit.origin, {
        horizontal,
        cols,
        maxHead: horizontal ? Infinity : maxY,
      });

    // A single mover, a non-mover, or a block that could not be placed in one
    // piece: pack each item on its own, exactly as the plain compactor would. A
    // one-item group must stay byte-identical to dragging that widget alone.
    if (!asBlock) {
      for (const l of unit.members) {
        if (!l.static) {
          if (horizontal) {
            compactItemHorizontal(compareWith, l, cols, order);
          } else {
            compactItemVertical(compareWith, l, order, maxY);
            maxY = Math.max(maxY, l.y + l.h);
          }
          compareWith.push(l);
        }
        l.moved = false;
      }
      continue;
    }

    for (const l of unit.members) {
      compareWith.push(l);
      if (!horizontal) maxY = Math.max(maxY, l.y + l.h);
      l.moved = false;
    }
  }

  return clones;
}

interface PlaceBlockOptions {
  horizontal: boolean;
  cols: number;
  /**
   * How far the board has filled along the compaction axis. The block's leading
   * edge is pulled back to it before floating, mirroring `compactItemVertical`'s
   * `y = Math.min(maxY, y)` — a group dropped far past the end of the board must
   * not be able to park out there any more than a single widget can.
   * `Infinity` disables the clamp (the horizontal compactor has no equivalent).
   */
  maxHead: number;
}

/**
 * Float a whole group into place with a single shift, so every member keeps its
 * exact offset from every other.
 *
 * The shape is taken from `origin` — where the members sat before any placement
 * ran — not from their live coordinates, which an earlier unit's collision
 * cascade may already have pulled apart (see `CompactionUnit.origin`).
 *
 * Members are mutated only on success; a failure restores them, which is what
 * lets the caller fall back to packing them individually. Failure is reserved
 * for the one case a block genuinely cannot express: a horizontal board where
 * settling the overlap would push a member past the last column.
 *
 * Returns whether the block was placed.
 */
function placeBlock(
  compareWith: Layout,
  members: LayoutItem[],
  origin: ReadonlyArray<{ x: number; y: number }>,
  { horizontal, cols, maxHead }: PlaceBlockOptions,
): boolean {
  const head = horizontal ? 'x' : 'y';
  const size = horizontal ? 'w' : 'h';

  const restore = () => {
    members.forEach((it, index) => {
      const at = origin[index] as { x: number; y: number };
      (it as Mutable<LayoutItem>).x = at.x;
      (it as Mutable<LayoutItem>).y = at.y;
    });
  };

  restore();

  const shift = (delta: number) => {
    for (const it of members) {
      (it as Mutable<LayoutItem>)[head] += delta;
    }
  };
  const leadingEdge = () => Math.min(...members.map((it) => it[head]));
  const trailingEdge = () =>
    Math.max(...members.map((it) => it[head] + it[size]));
  const overlaps = () =>
    members.some((it) => getFirstCollision(compareWith, it) !== undefined);

  // Correct the block into the grid, then pull it back to the fill line.
  if (leadingEdge() < 0) shift(-leadingEdge());
  const overshoot = leadingEdge() - maxHead;
  if (overshoot > 0) shift(-overshoot);

  // Float against gravity for as long as the *whole* block is clear one step
  // earlier. Testing the next position rather than the current one (which is
  // how `compactItemVertical` is written) matters here: a block can straddle
  // several rows, so stepping into an overlap and unwinding it afterwards would
  // let the settle loop below carry it past where it should have stopped.
  while (leadingEdge() > 0) {
    shift(-1);
    if (overlaps()) {
      shift(1);
      break;
    }
  }

  if (!overlaps()) {
    // Clear where it floated to — as long as it is still on the grid. Only the
    // horizontal axis can fail that: `cols` bounds it, and the delta clamp has
    // already guaranteed every member fits before this ran.
    if (!horizontal || trailingEdge() <= cols) return true;
    restore();

    return false;
  }

  // Landed on something already placed — push the block forward until it is
  // clear. Bounded by how far the placed items reach plus the block's own
  // extent, so an unresolvable frame cannot spin.
  const span = members.reduce((total, it) => total + it[size], 0);
  const limit =
    Math.max(0, ...compareWith.map((it) => it[head] + it[size])) +
    span +
    members.length +
    1;

  for (let step = 0; step < limit; step++) {
    shift(1);
    if (horizontal && trailingEdge() > cols) {
      restore();
      return false;
    }
    if (!overlaps()) return true;
  }

  restore();
  return false;
}

/**
 * Push every non-mover that overlaps the group (or another displaced item) past
 * it along `axis`, until nothing overlaps.
 *
 * `axis` is the board's compaction axis, so the compactor re-packs along the same
 * line immediately afterwards and pulls each displaced item back to its minimal
 * position. A board that does not compact at all (`compact="free"`) is pushed
 * down: down is the one direction a grid always has room in.
 *
 * Pushing along `x` can carry an item past the last column. That is fine and
 * deliberate: `compactItemHorizontal` wraps an overflowing item to the next row,
 * which is a resolution — rejecting the frame here instead would freeze better
 * than a quarter of all leftward group drags.
 *
 * Mutates `others` in place. Returns `false` if the cascade fails to settle,
 * which the caller turns into a rejected frame.
 */
function displaceOthers(
  movers: LayoutItem[],
  others: LayoutItem[],
  axis: 'x' | 'y',
): boolean {
  const size = axis === 'x' ? 'w' : 'h';
  // Place one at a time, in reading order, against a set that starts as the
  // group. Each push moves an item strictly past a placed item's far edge, so it
  // advances monotonically and the loop is bounded by the stack extent.
  const ordered = [...others].sort((a, b) =>
    a.y === b.y ? a.x - b.x : a.y - b.y,
  );
  const placed: LayoutItem[] = [...movers];
  const reach = (items: LayoutItem[]) =>
    Math.max(0, ...items.map((it) => it[axis] + it[size]));
  const limit = reach(movers) + reach(others) + others.length + 1;

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
          (item as Mutable<LayoutItem>)[axis] = other[axis] + other[size];
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
