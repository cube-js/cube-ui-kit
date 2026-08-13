import { describe, expect, it } from 'vitest';

import { getCompactor } from './compactors';
import { moveElements } from './group-move';

import type { LayoutItem } from './types';

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

/** `{ id: 'x,y' }` — compact enough to assert a whole layout at a glance. */
function positions(layout: LayoutItem[]): Record<string, string> {
  return Object.fromEntries(layout.map((it) => [it.i, `${it.x},${it.y}`]));
}

const free = getCompactor(null, false, true);
const loose = getCompactor(null, false, false);
const vertical = getCompactor('vertical', false, false);
const horizontal = getCompactor('horizontal', false, false);
const overlap = getCompactor(null, true, false);

describe('moveElements', () => {
  describe('rigid movement', () => {
    it('applies the same delta to every mover', () => {
      const layout = [item('a', 0, 0), item('b', 4, 6)];

      const result = moveElements(layout, new Set(['a', 'b']), 2, 1, {
        compactor: free,
        cols: 12,
      });

      expect(result.moved).toBe(true);
      expect(positions(result.layout)).toEqual({ a: '2,1', b: '6,7' });
    });

    it('leaves non-movers alone when nothing collides', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0), item('other', 8, 0)];

      const result = moveElements(layout, new Set(['a', 'b']), 0, 4, {
        compactor: free,
        cols: 12,
      });

      expect(positions(result.layout).other).toBe('8,0');
    });

    it('preserves the input item order', () => {
      const layout = [item('a', 0, 0), item('z', 4, 0), item('m', 8, 0)];

      const result = moveElements(layout, new Set(['a', 'm']), 0, 4, {
        compactor: free,
        cols: 12,
      });

      expect(result.layout.map((it) => it.i)).toEqual(['a', 'z', 'm']);
    });

    it('does not mutate the input layout', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0)];

      moveElements(layout, new Set(['a', 'b']), 3, 3, {
        compactor: free,
        cols: 12,
      });

      expect(positions(layout)).toEqual({ a: '0,0', b: '4,0' });
    });

    it('ignores ids that are not in the layout', () => {
      const layout = [item('a', 0, 0)];

      const result = moveElements(layout, new Set(['a', 'ghost']), 1, 0, {
        compactor: free,
        cols: 12,
      });

      expect(result.moved).toBe(true);
      expect(positions(result.layout)).toEqual({ a: '1,0' });
    });

    it('reports no movement when the selection is empty', () => {
      const layout = [item('a', 0, 0)];

      const result = moveElements(layout, new Set(), 1, 1, {
        compactor: free,
        cols: 12,
      });

      expect(result.moved).toBe(false);
      expect(positions(result.layout)).toEqual({ a: '0,0' });
    });
  });

  describe('group clamping', () => {
    // The bug this exists to prevent: clamping each item into bounds separately
    // collapses the group against the wall and it never recovers its shape.
    it('keeps the group shape when dragged past the left edge', () => {
      const layout = [item('a', 0, 0), item('b', 6, 0)];

      const result = moveElements(layout, new Set(['a', 'b']), -5, 0, {
        compactor: free,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,0', b: '6,0' });
      expect(result.dx).toBe(0);
    });

    it('keeps the group shape when dragged past the right edge', () => {
      const layout = [item('a', 0, 0), item('b', 6, 0)];

      // `b` can travel 4 columns (6 + 2 + 4 === 12); `a` must stop there too.
      const result = moveElements(layout, new Set(['a', 'b']), 9, 0, {
        compactor: free,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '4,0', b: '10,0' });
      expect(result.dx).toBe(4);
    });

    it('clamps upward movement at the top row', () => {
      const layout = [item('a', 0, 2), item('b', 4, 5)];

      const result = moveElements(layout, new Set(['a', 'b']), 0, -9, {
        compactor: free,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,0', b: '4,3' });
      expect(result.dy).toBe(-2);
    });

    it('clamps downward movement at maxRows', () => {
      const layout = [item('a', 0, 0), item('b', 4, 2)];

      const result = moveElements(layout, new Set(['a', 'b']), 0, 20, {
        compactor: free,
        cols: 12,
        maxRows: 8,
      });

      expect(positions(result.layout)).toEqual({ a: '0,4', b: '4,6' });
      expect(result.dy).toBe(4);
    });

    it('does not invert the range when an item is wider than the grid', () => {
      const layout = [item('wide', 0, 0, 14, 2), item('b', 0, 4)];

      const result = moveElements(layout, new Set(['wide', 'b']), 3, 0, {
        compactor: free,
        cols: 12,
      });

      expect(result.moved).toBe(true);
      expect(result.dx).toBe(0);
      expect(positions(result.layout)).toEqual({ wide: '0,0', b: '0,4' });
    });
  });

  describe('collisions with non-movers', () => {
    it('blocks the whole frame under preventCollision', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0), item('wall', 6, 0)];

      // Only `b` would hit `wall`, but a partial delta is what shears a group.
      const result = moveElements(layout, new Set(['a', 'b']), 2, 0, {
        compactor: free,
        cols: 12,
      });

      expect(result.moved).toBe(false);
      expect(positions(result.layout)).toEqual({
        a: '0,0',
        b: '4,0',
        wall: '6,0',
      });
    });

    it('pushes a colliding non-mover down when collisions are allowed', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0), item('victim', 0, 4)];

      const result = moveElements(layout, new Set(['a', 'b']), 0, 3, {
        compactor: loose,
        cols: 12,
      });

      expect(result.moved).toBe(true);
      expect(positions(result.layout)).toEqual({
        a: '0,3',
        b: '4,3',
        victim: '0,5',
      });
    });

    it('cascades the push through stacked non-movers', () => {
      const layout = [
        item('a', 0, 0),
        item('first', 0, 2),
        item('second', 0, 4),
      ];

      const result = moveElements(layout, new Set(['a']), 0, 1, {
        compactor: loose,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({
        a: '0,1',
        first: '0,3',
        second: '0,5',
      });
    });

    it('rejects a frame that would overlap a static non-mover', () => {
      const layout = [
        item('a', 0, 0),
        item('pinned', 0, 4, 2, 2, { static: true }),
      ];

      const result = moveElements(layout, new Set(['a']), 0, 3, {
        compactor: loose,
        cols: 12,
      });

      expect(result.moved).toBe(false);
      expect(positions(result.layout)).toEqual({ a: '0,0', pinned: '0,4' });
    });

    it('applies the delta untouched when overlap is allowed', () => {
      const layout = [item('a', 0, 0), item('victim', 0, 4)];

      const result = moveElements(layout, new Set(['a']), 0, 4, {
        compactor: overlap,
        cols: 12,
      });

      expect(result.moved).toBe(true);
      expect(positions(result.layout)).toEqual({ a: '0,4', victim: '0,4' });
    });
  });

  describe('movers', () => {
    it('never treats one mover as an obstacle for another', () => {
      // `b` sits directly below `a`; moving both down must not push `b` away.
      const layout = [item('a', 0, 0), item('b', 0, 2)];

      const result = moveElements(layout, new Set(['a', 'b']), 0, 2, {
        compactor: loose,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,2', b: '0,4' });
    });

    it('excludes a static item from the selection', () => {
      const layout = [
        item('a', 0, 0),
        item('pinned', 4, 0, 2, 2, { static: true }),
      ];

      const result = moveElements(layout, new Set(['a', 'pinned']), 0, 4, {
        compactor: loose,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,4', pinned: '4,0' });
    });

    it('includes a static item that opts back into dragging', () => {
      const layout = [
        item('a', 0, 0),
        item('opted', 4, 0, 2, 2, { static: true, isDraggable: true }),
      ];

      const result = moveElements(layout, new Set(['a', 'opted']), 0, 4, {
        compactor: loose,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,4', opted: '4,4' });
    });
  });

  describe('reflow of non-movers', () => {
    // The whole point: a group drag must reflow its neighbours exactly like a
    // single drag does. The moment the group vacates a row, whatever sat below
    // floats up into it — anything less reads as the board lagging a step.
    it('closes the gap the group leaves behind, in the same frame', () => {
      const layout = [
        item('a', 0, 0, 2, 1),
        item('b', 2, 0, 2, 1),
        item('e', 0, 3, 2, 1),
      ];

      const result = moveElements(layout, new Set(['a', 'b']), 0, 6, {
        compactor: vertical,
        cols: 12,
      });

      // `e` rises to the top and the group settles under it, rather than the
      // group parking in mid-air with `e` shoved below it.
      //
      // `b` follows `a` down even though the cell above it is free: the block
      // floats as a unit, so `b` cannot be left behind on row 0 with `e`. That
      // leftover cell is the accepted cost of holding the shape while the
      // pointer is down — the drop re-compacts the board and settles it.
      expect(positions(result.layout)).toEqual({
        a: '0,1',
        b: '2,1',
        e: '0,0',
      });
    });

    it('gives a one-widget group the same result as moving that widget', () => {
      const layout = [item('a', 0, 0, 2, 1), item('e', 0, 3, 2, 1)];

      const result = moveElements(layout, new Set(['a']), 0, 6, {
        compactor: vertical,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,1', e: '0,0' });
    });

    it('settles in one frame — reapplying the result changes nothing', () => {
      const layout = [
        item('a', 0, 0, 2, 1),
        item('b', 2, 0, 2, 1),
        item('e', 0, 3, 2, 1),
      ];
      const opts = { compactor: vertical, cols: 12 } as const;

      const once = moveElements(layout, new Set(['a', 'b']), 0, 6, opts);
      const twice = moveElements(once.layout, new Set(['a', 'b']), 0, 0, opts);

      expect(positions(twice.layout)).toEqual(positions(once.layout));
    });

    it('keeps a freeform group exactly where it was dropped', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0)];

      // Nothing compacts here, so the block stays put — the behaviour `free`
      // and legacy boards rely on.
      const result = moveElements(layout, new Set(['a', 'b']), 0, 5, {
        compactor: free,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,5', b: '4,5' });
    });

    it('still pushes a neighbour aside when nothing compacts', () => {
      const layout = [item('a', 0, 0), item('victim', 0, 4)];

      const result = moveElements(layout, new Set(['a']), 0, 3, {
        compactor: loose,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({ a: '0,3', victim: '0,5' });
    });

    // A leaked `static` flag would freeze a widget forever, and consumers
    // persist layouts, so it would survive a reload.
    it('never marks anything static', () => {
      const layout = [
        item('a', 0, 0),
        item('opted', 4, 0, 2, 2, { static: true, isDraggable: true }),
        item('other', 8, 0),
      ];

      const result = moveElements(layout, new Set(['a', 'opted']), 0, 3, {
        compactor: vertical,
        cols: 12,
      });

      expect(
        Object.fromEntries(result.layout.map((it) => [it.i, it.static])),
      ).toEqual({ a: false, opted: true, other: false });
    });
  });

  // A compacting board sorts every item by `(y, x)` and packs each one on its
  // own, which happily wedges a displaced neighbour between two group members.
  // The group has to be compacted as one run instead. Gravity still wins — the
  // block is never held in mid-air — so every result here is also a fixed point
  // of the plain compactor, which is what stops a later unrelated drag from
  // shearing the group after the fact.
  describe('group-aware compaction order', () => {
    /** Ids read top-to-bottom, which is what "the group split" is about. */
    function stackOrder(layout: LayoutItem[]): string[] {
      return [...layout]
        .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
        .map((it) => it.i);
    }

    const stack = () => [
      item('a', 0, 0, 12, 1),
      item('b', 0, 1, 12, 1),
      item('c', 0, 2, 12, 1),
      item('d', 0, 3, 12, 1),
    ];

    it('keeps a contiguous pair together when dragged up', () => {
      const result = moveElements(stack(), new Set(['c', 'd']), 0, -2, {
        compactor: vertical,
        cols: 12,
      });

      expect(stackOrder(result.layout)).toEqual(['c', 'd', 'a', 'b']);
      expect(positions(result.layout)).toEqual({
        c: '0,0',
        d: '0,1',
        a: '0,2',
        b: '0,3',
      });
    });

    it('keeps a contiguous pair together across varied heights', () => {
      const layout = [
        item('a', 0, 0, 12, 1),
        item('b', 0, 1, 12, 1),
        item('c', 0, 2, 12, 2),
        item('d', 0, 4, 12, 1),
      ];

      // Over-dragged on purpose: the delta clamps to -2 against the group.
      const result = moveElements(layout, new Set(['c', 'd']), 0, -4, {
        compactor: vertical,
        cols: 12,
      });

      expect(stackOrder(result.layout)).toEqual(['c', 'd', 'a', 'b']);
      expect(positions(result.layout)).toEqual({
        c: '0,0',
        d: '0,2',
        a: '0,3',
        b: '0,4',
      });
    });

    it('keeps a group together in a multi-column layout', () => {
      const layout = [
        item('a', 0, 0, 6, 2),
        item('c', 0, 2, 6, 1),
        item('d', 6, 2, 6, 1),
      ];

      const result = moveElements(layout, new Set(['c', 'd']), 0, -2, {
        compactor: vertical,
        cols: 12,
      });

      // `c` and `d` shared a row before the drag and still do after it.
      expect(positions(result.layout)).toEqual({
        c: '0,0',
        d: '6,0',
        a: '0,1',
      });
    });

    // The tie-break, the other way round. Moving *with* gravity, the widgets
    // the group passed have to claim the vacated rows first — hand the group
    // the tie here and it lands back where it started, so the drag does nothing.
    it('lets the widgets above fall through when the group is dragged down', () => {
      const result = moveElements(stack(), new Set(['a', 'b']), 0, 2, {
        compactor: vertical,
        cols: 12,
      });

      expect(stackOrder(result.layout)).toEqual(['c', 'a', 'b', 'd']);
      expect(positions(result.layout)).toEqual({
        c: '0,0',
        a: '0,1',
        b: '0,2',
        d: '0,3',
      });
    });

    it('mirrors the fix under horizontal compaction', () => {
      const layout = [
        item('a', 0, 0, 1, 12),
        item('b', 1, 0, 1, 12),
        item('c', 2, 0, 2, 12),
        item('d', 4, 0, 1, 12),
      ];

      const result = moveElements(layout, new Set(['c', 'd']), -4, 0, {
        compactor: horizontal,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({
        c: '0,0',
        d: '2,0',
        a: '3,0',
        b: '4,0',
      });
    });

    it('never lets a non-mover land between two movers, at any delta', () => {
      const opts = { compactor: vertical, cols: 12 } as const;
      const ids = new Set(['c', 'd']);

      for (let dy = -6; dy <= 6; dy++) {
        const result = moveElements(stack(), ids, 0, dy, opts);
        const order = stackOrder(result.layout);
        const [first, last] = [order.indexOf('c'), order.indexOf('d')];

        expect(Math.abs(last - first)).toBe(1);

        // Every frame is where the plain compactor would leave it, so nothing
        // re-flows on the next pass.
        const again = moveElements(result.layout, ids, 0, 0, opts);
        expect(positions(again.layout)).toEqual(positions(result.layout));
      }
    });

    it('never floats a static non-mover', () => {
      const layout = [
        item('a', 0, 0, 12, 1),
        item('pinned', 0, 1, 6, 1, { static: true }),
        item('c', 0, 2, 6, 1),
        item('d', 6, 2, 6, 1),
      ];

      const result = moveElements(layout, new Set(['c', 'd']), 0, -2, {
        compactor: vertical,
        cols: 12,
      });

      expect(positions(result.layout).pinned).toBe('0,1');
    });

    it('leaves the overlap compactors alone', () => {
      const layout = [item('a', 0, 0), item('b', 4, 0), item('e', 0, 6)];

      // `allowOverlap` clones rather than compacts, so the group lands exactly
      // where it was dropped and `e` is not disturbed.
      const result = moveElements(layout, new Set(['a', 'b']), 0, 4, {
        compactor: overlap,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({
        a: '0,4',
        b: '4,4',
        e: '0,6',
      });
    });
  });

  // Ordering alone is not enough. A non-mover sitting even one row above the
  // group's landing row sorts first, and then each member floats against
  // whatever happens to be above *it* — so the group stalls, and members with
  // different obstacles above them end up on different rows. Moving against
  // gravity therefore displaces the widgets in the way first (exactly as
  // `moveElement` does for one widget), and the group is floated as one block.
  describe('moving against gravity', () => {
    /** `{ id: 'x,y' }` plus the offsets between members, which must never change. */
    function offsets(layout: LayoutItem[], a: string, b: string) {
      const first = layout.find((it) => it.i === a)!;
      const second = layout.find((it) => it.i === b)!;

      return `${second.x - first.x},${second.y - first.y}`;
    }

    // Every fixture here is a fixed point of `verticalCompactor` — i.e. a real
    // board at rest — because that is the only state a drag can start from.
    it('keeps a pair on one row when the widgets above them differ', () => {
      const layout = [
        item('x', 0, 0, 6, 3),
        item('d', 6, 2, 6, 1),
        item('a', 0, 3, 6, 1),
        item('b', 6, 3, 6, 1),
      ];

      const result = moveElements(layout, new Set(['a', 'b']), 0, -1, {
        compactor: vertical,
        cols: 12,
      });

      // `a` is blocked by the tall `x` and `b` only by the short `d`, so packing
      // them one at a time used to leave `a` where it started and float `b` to
      // the top row — with `d` wedged between them.
      expect(positions(result.layout)).toEqual({
        a: '0,0',
        b: '6,0',
        x: '0,1',
        d: '6,1',
      });
    });

    it('advances the group instead of standing still under a taller widget', () => {
      const layout = [
        item('x', 0, 0, 12, 2),
        item('a', 0, 2, 6, 1),
        item('b', 6, 2, 6, 1),
      ];

      const result = moveElements(layout, new Set(['a', 'b']), 0, -1, {
        compactor: vertical,
        cols: 12,
      });

      // `x` moves below and the pair floats to the top — the same thing that
      // happens when one widget is dragged a row up into a taller neighbour.
      // Previously nothing moved at all: `x` sorted first and blocked both.
      expect(positions(result.layout)).toEqual({
        a: '0,0',
        b: '6,0',
        x: '0,1',
      });
    });

    it('never wedges a full-width divider between two members', () => {
      const layout = [
        item('x', 0, 0, 12, 1),
        item('divider', 0, 1, 12, 1),
        item('a', 0, 2, 6, 1),
        item('b', 6, 2, 6, 1),
      ];

      const result = moveElements(layout, new Set(['a', 'b']), 0, -1, {
        compactor: vertical,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({
        x: '0,0',
        a: '0,1',
        b: '6,1',
        divider: '0,2',
      });
    });

    it('holds the group shape at every delta over a ragged layout', () => {
      const layout = [
        item('x', 0, 0, 6, 2),
        item('d', 6, 0, 6, 1),
        item('b', 6, 1, 6, 1),
        item('a', 0, 2, 6, 1),
      ];
      const ids = new Set(['a', 'b']);

      for (let dy = -4; dy <= 4; dy++) {
        const result = moveElements(layout, ids, 0, dy, {
          compactor: vertical,
          cols: 12,
        });

        // `b` sits one row above `a` and six columns across; a rigid block keeps
        // both offsets no matter what it has to climb over.
        expect(offsets(result.layout, 'a', 'b')).toBe('6,-1');
      }
    });

    it('mirrors the displacement under horizontal compaction', () => {
      const layout = [
        item('x', 0, 0, 2, 12),
        item('a', 2, 0, 1, 6),
        item('b', 2, 6, 1, 6),
      ];

      const result = moveElements(layout, new Set(['a', 'b']), -1, 0, {
        compactor: horizontal,
        cols: 12,
      });

      expect(positions(result.layout)).toEqual({
        a: '0,0',
        b: '0,6',
        x: '1,0',
      });
    });

    it('packs a sideways-displaced widget back inside the grid', () => {
      const layout = [
        item('x', 0, 0, 3, 12),
        item('a', 3, 0, 3, 6),
        item('b', 3, 6, 3, 6),
      ];

      // Clearing the group puts `x` at column 5 of 6, past the last column.
      // Freezing the drag over that would cost a quarter of all leftward group
      // drags; the compactor pulls it back in instead.
      const result = moveElements(layout, new Set(['a', 'b']), -1, 0, {
        compactor: horizontal,
        cols: 6,
      });

      expect(result.moved).toBe(true);
      expect(positions(result.layout)).toEqual({
        a: '0,0',
        b: '0,6',
        x: '3,0',
      });
    });
  });

  // `compactItemVertical` cascades through `resolveCompactionCollision`, which
  // shoves items *later in the placement order* out of a non-mover's way. When
  // the group is placed after a non-mover — which is every with-gravity drag —
  // that cascade reaches inside the group and moves one member without the
  // others, so a block placed from those coordinates preserves an already-broken
  // shape, and two members can end up on top of each other.
  describe('frame integrity', () => {
    function overlappingPairs(layout: LayoutItem[]): string[] {
      const pairs: string[] = [];

      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const a = layout[i]!;
          const b = layout[j]!;
          if (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
          ) {
            pairs.push(`${a.i}/${b.i}`);
          }
        }
      }

      return pairs;
    }

    it('never emits overlapping widgets when dragged with gravity', () => {
      const layout = [
        item('w1', 0, 0, 2, 1),
        item('w3', 5, 0, 4, 1),
        item('w2', 0, 1, 12, 1),
        item('w4', 0, 2, 12, 1),
        item('w5', 0, 3, 6, 1),
        item('w0', 6, 3, 4, 3),
      ];

      const result = moveElements(layout, new Set(['w5', 'w3']), 0, 3, {
        compactor: vertical,
        cols: 12,
      });

      expect(overlappingPairs(result.layout)).toEqual([]);
    });

    it('holds the group offsets when dragged with gravity too', () => {
      const layout = [
        item('w1', 0, 0, 2, 1),
        item('w3', 5, 0, 4, 1),
        item('w2', 0, 1, 12, 1),
        item('w4', 0, 2, 12, 1),
        item('w5', 0, 3, 6, 1),
        item('w0', 6, 3, 4, 3),
      ];
      const ids = new Set(['w5', 'w3']);

      for (let dy = 0; dy <= 5; dy++) {
        const result = moveElements(layout, ids, 0, dy, {
          compactor: vertical,
          cols: 12,
        });
        const w3 = result.layout.find((it) => it.i === 'w3')!;
        const w5 = result.layout.find((it) => it.i === 'w5')!;

        expect(`${w3.x - w5.x},${w3.y - w5.y}`).toBe('5,-3');
      }
    });

    // The hand-written cases above are the ones that were actually reported;
    // this is the net cast wide enough to catch the next one. Deterministic
    // (xorshift32 off a fixed seed) and ~150ms, so it is a regression guard
    // rather than a flaky search.
    it('never overlaps, escapes the grid, or shears a group, over many layouts', () => {
      const random = ((s: number) => () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;

        return (s >>> 0) / 0x100000000;
      })(0xc0ffee);

      const shape = (l: LayoutItem[], ids: string[]) => {
        const members = ids.map((id) => l.find((it) => it.i === id)!);

        return members
          .map((m) => `${m.x - members[0]!.x},${m.y - members[0]!.y}`)
          .join(' ');
      };

      let checked = 0;

      for (let round = 0; round < 4000; round++) {
        const raw = Array.from(
          { length: 3 + Math.floor(random() * 5) },
          (_, i) => {
            const w = 1 + Math.floor(random() * 6);

            return item(
              `w${i}`,
              Math.floor(random() * (12 - w + 1)),
              Math.floor(random() * 6),
              w,
              1 + Math.floor(random() * 3),
            );
          },
        );

        // A drag can only ever start from a resting board, so compact first and
        // skip anything that did not settle in one pass.
        const base = [...vertical.compact(raw, 12)];
        if (overlappingPairs(base).length) continue;

        const ids = base.map((it) => it.i).filter(() => random() < 0.5);
        if (ids.length < 2) continue;

        const result = moveElements(
          base,
          new Set(ids),
          Math.floor(random() * 9) - 4,
          Math.floor(random() * 9) - 4,
          { compactor: vertical, cols: 12 },
        );
        if (!result.moved) continue;

        checked++;
        expect(overlappingPairs(result.layout)).toEqual([]);
        for (const it of result.layout) {
          expect(`${it.i}:${it.x >= 0 && it.y >= 0 && it.x + it.w <= 12}`).toBe(
            `${it.i}:true`,
          );
        }
        // The whole point: on the axis a dashboard actually compacts along, the
        // block is rigid without exception.
        expect(shape(result.layout, ids)).toBe(shape(base, ids));
      }

      expect(checked).toBeGreaterThan(500);
    });

    it('keeps every widget inside the grid on a horizontal board', () => {
      const layout = [
        item('w0', 4, 1, 2, 12),
        item('w1', 0, 4, 4, 12),
        item('w2', 0, 0, 3, 1),
        item('w3', 6, 2, 4, 2),
        item('w4', 6, 4, 3, 12),
      ];

      for (let dx = -4; dx <= 4; dx++) {
        const result = moveElements(layout, new Set(['w3', 'w0']), dx, 0, {
          compactor: horizontal,
          cols: 12,
        });

        for (const it of result.layout) {
          expect(`${it.i}:${it.x + it.w <= 12}`).toBe(`${it.i}:true`);
        }
        expect(overlappingPairs(result.layout)).toEqual([]);
      }
    });
  });

  describe('rejected frames', () => {
    it('returns a zero delta alongside the untouched layout', () => {
      const layout = [item('a', 0, 0), item('wall', 2, 0)];

      const result = moveElements(layout, new Set(['a']), 2, 0, {
        compactor: free,
        cols: 12,
      });

      expect(result).toMatchObject({ moved: false, dx: 0, dy: 0 });
      expect(positions(result.layout)).toEqual({ a: '0,0', wall: '2,0' });
    });
  });
});
