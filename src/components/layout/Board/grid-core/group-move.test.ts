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

      // `e` rises to the top and the group settles around it, rather than the
      // group parking in mid-air with `e` shoved below it. A vertically
      // compacted board never leaves a gap, for a group no more than for one
      // widget.
      expect(positions(result.layout)).toEqual({
        a: '0,1',
        b: '2,0',
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
