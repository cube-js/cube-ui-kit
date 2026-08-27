import { describe, expect, it } from 'vitest';

import { getAllCollisions } from './collision';
import {
  createCollisionResolver,
  isOverlapFree,
  maxFreeRectAt,
} from './collision-modes';
import { moveElement } from './layout';

import type { CollisionMode, LayoutItem } from './types';

function item(
  i: string,
  x: number,
  y: number,
  w = 2,
  h = 2,
  extra: Partial<LayoutItem> = {},
): LayoutItem {
  return { i, x, y, w, h, ...extra };
}

/** `{ id: 'x,y w×h' }` — a whole layout assertable at a glance. */
function rects(layout: LayoutItem[]): Record<string, string> {
  return Object.fromEntries(
    layout.map((it) => [it.i, `${it.x},${it.y} ${it.w}x${it.h}`]),
  );
}

/**
 * Run one blocked placement through the engine the way a board does: move `id` to
 * `(x, y)` with collisions prevented and the mode's resolver attached.
 */
function place(
  layout: LayoutItem[],
  id: string,
  x: number,
  y: number,
  mode: CollisionMode,
  options: { cols?: number; maxRows?: number; allowExchange?: boolean } = {},
): LayoutItem[] {
  const working = layout.map((l) => ({ ...l }));
  const target = working.find((l) => l.i === id)!;
  const desired = { w: target.w, h: target.h };
  const cols = options.cols ?? 6;

  return moveElement(working, target, x, y, true, true, null, cols, false, {
    resolveCollision: createCollisionResolver(mode, {
      cols,
      maxRows: options.maxRows,
      desired,
      allowExchange: options.allowExchange,
    }),
  });
}

describe('maxFreeRectAt', () => {
  const limits = { cols: 6 };

  it('keeps the desired size when it already fits', () => {
    expect(maxFreeRectAt([], { x: 0, y: 0 }, { w: 3, h: 2 }, limits)).toEqual({
      w: 3,
      h: 2,
    });
  });

  it('never upscales into the room around the anchor', () => {
    expect(maxFreeRectAt([], { x: 0, y: 0 }, { w: 1, h: 1 }, limits)).toEqual({
      w: 1,
      h: 1,
    });
  });

  it('shrinks to the free space to the right', () => {
    // Columns 3+ are taken, so a 4-wide item can only keep 3 columns.
    expect(
      maxFreeRectAt(
        [item('x', 3, 0, 3, 2)],
        { x: 0, y: 0 },
        { w: 4, h: 2 },
        limits,
      ),
    ).toEqual({ w: 3, h: 2 });
  });

  it('shrinks to the free space below', () => {
    expect(
      maxFreeRectAt(
        [item('x', 0, 2, 3, 2)],
        { x: 0, y: 0 },
        { w: 3, h: 4 },
        limits,
      ),
    ).toEqual({ w: 3, h: 2 });
  });

  it('picks the largest-area rectangle when width and height trade off', () => {
    // Column 2 is blocked from row 1 down, so the band is either 3 wide and 1
    // tall (area 3) or 2 wide and 3 tall (area 6).
    expect(
      maxFreeRectAt(
        [item('x', 2, 1, 1, 3)],
        { x: 0, y: 0 },
        { w: 3, h: 3 },
        limits,
      ),
    ).toEqual({ w: 2, h: 3 });
  });

  it('breaks an area tie towards the wider rectangle', () => {
    // Columns 2-3 are free for 2 rows, so the band is either 2 wide and 4 tall or
    // 4 wide and 2 tall - both area 8. The wide one wins.
    expect(
      maxFreeRectAt(
        [item('x', 2, 2, 2, 2)],
        { x: 0, y: 0 },
        { w: 4, h: 4 },
        limits,
      ),
    ).toEqual({ w: 4, h: 2 });
  });

  it('clamps to the column count', () => {
    expect(maxFreeRectAt([], { x: 4, y: 0 }, { w: 4, h: 1 }, limits)).toEqual({
      w: 2,
      h: 1,
    });
  });

  it('clamps to the row limit', () => {
    expect(
      maxFreeRectAt(
        [],
        { x: 0, y: 2 },
        { w: 2, h: 4 },
        { cols: 6, maxRows: 4 },
      ),
    ).toEqual({ w: 2, h: 2 });
  });

  it('refuses a fit below the minimum size', () => {
    expect(
      maxFreeRectAt(
        [item('x', 2, 0, 4, 2)],
        { x: 0, y: 0 },
        { w: 4, h: 2 },
        limits,
        { minW: 3 },
      ),
    ).toBeNull();
  });

  it('refuses an anchor with no free cell at all', () => {
    expect(
      maxFreeRectAt(
        [item('x', 0, 0, 2, 2)],
        { x: 0, y: 0 },
        { w: 2, h: 2 },
        limits,
      ),
    ).toBeNull();
  });
});

describe('createCollisionResolver', () => {
  it('returns nothing for revert, leaving the engine on its original path', () => {
    expect(createCollisionResolver('revert', { cols: 6 })).toBeUndefined();
    expect(createCollisionResolver(undefined, { cols: 6 })).toBeUndefined();
  });
});

describe('collisionMode: revert', () => {
  it('snaps a colliding move back', () => {
    const layout = [item('a', 0, 0), item('b', 2, 0)];
    const next = place(layout, 'a', 2, 0, 'revert');

    expect(rects(next)).toEqual({ a: '0,0 2x2', b: '2,0 2x2' });
  });
});

describe('collisionMode: downscale', () => {
  it('shrinks a widget into the gap it was dropped on', () => {
    // A 4-wide widget dropped at column 0 with only 3 columns free.
    const layout = [item('a', 0, 4, 4, 2), item('b', 3, 0, 3, 2)];
    const next = place(layout, 'a', 0, 0, 'downscale');

    expect(rects(next)).toEqual({ a: '0,0 3x2', b: '3,0 3x2' });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('shrinks in both axes at once', () => {
    const layout = [
      item('a', 0, 4, 4, 4),
      item('b', 2, 0, 4, 4),
      item('c', 0, 2, 2, 2),
    ];
    const next = place(layout, 'a', 0, 0, 'downscale');

    expect(rects(next).a).toBe('0,0 2x2');
    expect(isOverlapFree(next)).toBe(true);
  });

  it('reverts when the widget cannot shrink below its minimum width', () => {
    const layout = [item('a', 0, 4, 4, 2, { minW: 4 }), item('b', 3, 0, 3, 2)];
    const next = place(layout, 'a', 0, 0, 'downscale');

    expect(rects(next)).toEqual({ a: '0,4 4x2', b: '3,0 3x2' });
  });

  it('reverts when the drop cell itself is occupied', () => {
    // Nothing to shrink into: the anchor cell is taken.
    const layout = [item('a', 0, 4), item('b', 2, 0, 4, 2)];
    const next = place(layout, 'a', 2, 0, 'downscale');

    expect(rects(next).a).toBe('0,4 2x2');
  });

  it('shrinks into room on either side of a blocker, not just the left', () => {
    // `gridBounds` clamps a drag anchor to `cols - w`, so a 4-wide widget on a
    // 6-column grid can never be anchored past column 2. With the blocker on the
    // left that is every cell of the free room, and the drop used to revert -
    // downscaling worked on one side of a blocker and not the other.
    const roomOnTheRight = place(
      [item('a', 0, 4, 4, 2), item('b', 0, 0, 3, 2)],
      'a',
      2,
      0,
      'downscale',
    );
    expect(rects(roomOnTheRight)).toEqual({ a: '3,0 3x2', b: '0,0 3x2' });
    expect(isOverlapFree(roomOnTheRight)).toBe(true);

    // The mirror image, which has always worked because column 0 is reachable.
    const roomOnTheLeft = place(
      [item('a', 0, 4, 4, 2), item('b', 3, 0, 3, 2)],
      'a',
      0,
      0,
      'downscale',
    );
    expect(rects(roomOnTheLeft)).toEqual({ a: '0,0 3x2', b: '3,0 3x2' });
  });

  it('takes the largest of the cells the anchor clamp hid', () => {
    // Free room in columns 3-5, so anchoring at 3 (3 wide) beats 4 (2 wide) and
    // 5 (1 wide). All three are past the clamp at column 2.
    const next = place(
      [item('a', 0, 4, 4, 1), item('b', 0, 0, 3, 1)],
      'a',
      2,
      0,
      'downscale',
    );

    expect(rects(next).a).toBe('3,0 3x1');
  });

  it('never reaches past a cell the pointer could have aimed at', () => {
    // Same 4-wide widget and the same clamp at column 2, but the drop is at
    // column 0 - the pointer's own choice, with columns 1 and 2 free and just as
    // reachable. Recovering the far columns here would skip over those and land
    // the widget three columns from where it was dropped, so a blocked drop that
    // is not pinned against the edge still reverts.
    const next = place(
      [item('a', 0, 4, 4, 1), item('b', 0, 0, 1, 1)],
      'a',
      0,
      0,
      'downscale',
    );

    expect(rects(next).a).toBe('0,4 4x1');
  });

  it('recovers hidden cells on the row axis too', () => {
    // The row clamp is the same rule: a 4-tall widget on a 6-row grid cannot be
    // anchored past row 2, and the blocker covers rows 0-2 of that column.
    const next = place(
      [item('a', 4, 0, 2, 4), item('b', 0, 0, 2, 3)],
      'a',
      0,
      2,
      'downscale',
      { maxRows: 6 },
    );

    expect(rects(next).a).toBe('0,3 2x3');
    expect(isOverlapFree(next)).toBe(true);
  });

  it('respects the row limit when shrinking downward', () => {
    const layout = [item('a', 4, 0, 2, 4), item('b', 0, 2, 2, 2)];
    const next = place(layout, 'a', 0, 0, 'downscale', { maxRows: 4 });

    expect(rects(next).a).toBe('0,0 2x2');
    expect(isOverlapFree(next)).toBe(true);
  });

  it('never grows a widget that fits', () => {
    // No collision at all, so nothing is resolved and the size is untouched.
    const layout = [item('a', 0, 4, 1, 1)];
    const next = place(layout, 'a', 0, 0, 'downscale');

    expect(rects(next).a).toBe('0,0 1x1');
  });

  it('re-resolves from the start size rather than ratcheting down', () => {
    // What a drag does frame by frame: the widget shrinks over the gap, then goes
    // back to its full size once the pointer reaches free space. Measuring from
    // the *previous frame's* size instead would leave it permanently shrunken.
    const layout = [item('a', 0, 4, 4, 2), item('b', 3, 0, 3, 2)];
    const overGap = place(layout, 'a', 0, 0, 'downscale');
    expect(rects(overGap).a).toBe('0,0 3x2');

    const working = overGap.map((l) => ({ ...l }));
    const target = working.find((l) => l.i === 'a')!;
    // The registry restores the gesture's start size before resolving a new cell.
    target.w = 4;
    target.h = 2;
    const backInTheOpen = moveElement(
      working,
      target,
      0,
      2,
      true,
      true,
      null,
      6,
      false,
      {
        resolveCollision: createCollisionResolver('downscale', {
          cols: 6,
          desired: { w: 4, h: 2 },
        }),
      },
    );

    expect(rects(backInTheOpen).a).toBe('0,2 4x2');
  });
});

describe('collisionMode: swap', () => {
  it('exchanges two same-sized widgets', () => {
    const layout = [item('a', 0, 0), item('b', 2, 0)];
    const next = place(layout, 'a', 2, 0, 'swap');

    expect(rects(next)).toEqual({ a: '2,0 2x2', b: '0,0 2x2' });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('resizes each widget down to the slot it moves into, never up', () => {
    // `a` is 4x2 and lands on 2x2 `b`: it keeps only what fits beside `b`'s slot,
    // and `b` moves into the slot `a` vacated at its own (smaller) size.
    const layout = [item('a', 0, 0, 4, 2), item('b', 4, 0, 2, 2)];
    const next = place(layout, 'a', 4, 0, 'swap');

    expect(rects(next)).toEqual({ a: '4,0 2x2', b: '0,0 2x2' });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('keeps the dragged size when the target slot has room beside it', () => {
    // `b` is 1x2 at column 4 with column 5 free, so the incoming 2x2 fits whole.
    const layout = [item('a', 0, 0, 2, 2), item('b', 4, 0, 1, 2)];
    const next = place(layout, 'a', 4, 0, 'swap');

    expect(rects(next)).toEqual({ a: '4,0 2x2', b: '0,0 1x2' });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('never lets the two claim the same cells when the slots are adjacent', () => {
    const layout = [item('a', 0, 0, 3, 2), item('b', 3, 0, 3, 2)];
    const next = place(layout, 'a', 3, 0, 'swap');

    expect(isOverlapFree(next)).toBe(true);
    expect(rects(next)).toEqual({ a: '3,0 3x2', b: '0,0 3x2' });
  });

  it('trades with the widget the drop covers most when several are under it', () => {
    // A 6-wide drop covering `b` and `c` equally: the tie goes to `b`, earlier in
    // reading order. Refusing such frames instead would leave a band mid-drag
    // where nothing is swapped at all.
    const layout = [
      item('a', 0, 4, 6, 2),
      item('b', 2, 0, 2, 2),
      item('c', 4, 0, 2, 2),
    ];
    const next = place(layout, 'a', 0, 0, 'swap');

    expect(rects(next)).toEqual({
      a: '2,0 2x2',
      b: '0,4 2x2',
      c: '4,0 2x2',
    });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('picks the widget with the larger overlap, not the first one found', () => {
    // `a` is 4 wide and lands covering one column of `b` and three of `c`.
    const layout = [
      item('a', 0, 4, 4, 1),
      item('b', 1, 0, 1, 1),
      item('c', 2, 0, 3, 1),
    ];
    const next = place(layout, 'a', 1, 0, 'swap');

    expect(rects(next).c).toBe('0,4 3x1');
    expect(rects(next).b).toBe('1,0 1x1');
    expect(isOverlapFree(next)).toBe(true);
  });

  it('never displaces more than one widget', () => {
    const layout = [
      item('a', 0, 4, 6, 2),
      item('b', 2, 0, 2, 2),
      item('c', 4, 0, 2, 2),
    ];
    const before = rects(layout);
    const next = place(layout, 'a', 0, 0, 'swap');

    const moved = next.filter(
      (it) => it.i !== 'a' && rects([it])[it.i] !== before[it.i],
    );
    expect(moved.length).toBeLessThanOrEqual(1);
  });

  it('does not exchange with a static widget', () => {
    const layout = [item('a', 0, 0), item('b', 2, 0, 2, 2, { static: true })];
    const next = place(layout, 'a', 2, 0, 'swap');

    expect(rects(next)).toEqual({ a: '0,0 2x2', b: '2,0 2x2' });
  });

  it('sends the displaced widget to the cell the dragged one came from', () => {
    // `from` is the caller's business: the registry hands over the cell the
    // gesture began at, so one drag exchanges once no matter how far it sweeps.
    const layout = [item('a', 0, 0), item('b', 4, 0)];
    const next = place(layout, 'a', 4, 0, 'swap');

    expect(rects(next)).toEqual({ a: '4,0 2x2', b: '0,0 2x2' });
  });

  it('does not exchange when the widget has no slot to give back', () => {
    // `allowExchange: false` is what a cross-board drop passes: the incoming
    // widget never occupied a slot on this board.
    const layout = [item('a', 0, 0), item('b', 2, 0)];
    const next = place(layout, 'a', 2, 0, 'swap', { allowExchange: false });

    expect(rects(next)).toEqual({ a: '0,0 2x2', b: '2,0 2x2' });
  });

  it('downscales at an empty anchor when exchange is disabled', () => {
    // This is the cross-board `swap` path: the incoming widget has no target
    // slot to trade, so it may occupy the empty anchor and shrink before the
    // blocker, but the blocker itself never moves.
    const layout = [item('a', 0, 4, 4, 2), item('b', 3, 0, 3, 2)];
    const next = place(layout, 'a', 0, 0, 'swap', { allowExchange: false });

    expect(rects(next)).toEqual({ a: '0,0 3x2', b: '3,0 3x2' });
    expect(isOverlapFree(next)).toBe(true);
  });

  it('reverts when the displaced widget cannot fit the vacated slot', () => {
    // `b` needs 4 columns and `a` only frees 2, with everything else taken.
    const layout = [
      item('a', 0, 0, 2, 2),
      item('b', 2, 0, 4, 2, { minW: 4 }),
      item('c', 0, 2, 6, 2),
    ];
    const next = place(layout, 'a', 2, 0, 'swap');

    expect(rects(next).a).toBe('0,0 2x2');
    expect(rects(next).b).toBe('2,0 4x2');
  });

  it('exchanges back when the widget is dragged onto its partner again', () => {
    const layout = [item('a', 0, 0), item('b', 2, 0)];
    const once = place(layout, 'a', 2, 0, 'swap');
    const twice = place(once, 'a', 0, 0, 'swap');

    expect(rects(twice)).toEqual({ a: '0,0 2x2', b: '2,0 2x2' });
  });
});

describe('resolved layouts', () => {
  it('always leave the moved item free of collisions', () => {
    const layout = [
      item('a', 0, 6, 4, 3),
      item('b', 2, 0, 2, 2),
      item('c', 0, 3, 3, 2),
      item('d', 4, 1, 2, 4),
    ];

    for (const mode of ['downscale', 'swap'] as const) {
      for (let x = 0; x <= 5; x++) {
        for (let y = 0; y <= 6; y++) {
          const next = place(layout, 'a', x, y, mode, { cols: 6 });
          const moved = next.find((l) => l.i === 'a')!;
          expect(
            getAllCollisions(next, moved),
            `${mode} at ${x},${y}: ${JSON.stringify(rects(next))}`,
          ).toEqual([]);
          expect(isOverlapFree(next)).toBe(true);
        }
      }
    }
  });
});
