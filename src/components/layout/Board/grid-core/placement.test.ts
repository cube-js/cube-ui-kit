import { describe, expect, it } from 'vitest';

import { distributeEvenly, placeInFreeSlot } from './placement';

import type { Layout, LayoutItem } from './types';

function item(i: string, x: number, y: number, w = 1, h = 1): LayoutItem {
  return { i, x, y, w, h };
}

describe('placeInFreeSlot', () => {
  it('keeps the preferred cell when it is free', () => {
    const others: Layout = [item('a', 0, 0)];
    expect(placeInFreeSlot(others, item('b', 2, 3), 4)).toMatchObject({
      x: 2,
      y: 3,
    });
  });

  it('scans the preferred row before moving down', () => {
    // (1,1) is taken, so the next free cell on the SAME row wins over any cell
    // on another row. This is what keeps a programmatic add on the row the user
    // aimed at instead of teleporting it.
    const others: Layout = [item('a', 1, 1)];
    expect(placeInFreeSlot(others, item('b', 1, 1), 3)).toMatchObject({
      x: 0,
      y: 1,
    });
  });

  it('moves down when the whole preferred row is full', () => {
    const others: Layout = [item('a', 0, 0), item('b', 1, 0)];
    expect(placeInFreeSlot(others, item('c', 0, 0), 2)).toMatchObject({
      x: 0,
      y: 1,
    });
  });

  it('searches upward once the band below the row limit is full', () => {
    // Rows 1 and 2 are full and `maxRows` forbids row 3, so the only free slot
    // is above the preferred row.
    const others: Layout = [
      item('a', 0, 1),
      item('b', 1, 1),
      item('c', 0, 2),
      item('d', 1, 2),
    ];
    expect(placeInFreeSlot(others, item('e', 0, 1), 2, 3)).toMatchObject({
      x: 0,
      y: 0,
    });
  });

  it('never places an item past the row limit, even with nowhere free', () => {
    const others: Layout = [
      item('a', 0, 0),
      item('b', 1, 0),
      item('c', 0, 1),
      item('d', 1, 1),
    ];
    // A full 2×2 grid with maxRows 2: bounds win over overlap, exactly as
    // `gridBounds` resolves it.
    const placed = placeInFreeSlot(others, item('e', 1, 1), 2, 2);
    expect(placed.y).toBeLessThanOrEqual(1);
    expect(placed.x).toBeLessThanOrEqual(1);
  });

  it('caps width to the column count and never resizes otherwise', () => {
    const placed = placeInFreeSlot([], item('a', 0, 0, 9, 4), 3);
    expect(placed.w).toBe(3);
    expect(placed.h).toBe(4);
  });

  it('does not mutate the input item', () => {
    const original = item('a', 5, 5);
    placeInFreeSlot([item('b', 5, 5)], original, 3);
    expect(original).toEqual({ i: 'a', x: 5, y: 5, w: 1, h: 1 });
  });
});

describe('distributeEvenly', () => {
  it('returns an empty layout untouched', () => {
    expect(distributeEvenly([], { cols: 4, rows: 4 })).toEqual([]);
  });

  it('tiles one line into equal full-height columns', () => {
    const layout: Layout = [item('a', 0, 0), item('b', 1, 0), item('c', 2, 0)];
    expect(distributeEvenly(layout, { cols: 6, rows: 2 })).toEqual([
      { i: 'a', x: 0, y: 0, w: 2, h: 2 },
      { i: 'b', x: 2, y: 0, w: 2, h: 2 },
      { i: 'c', x: 4, y: 0, w: 2, h: 2 },
    ]);
  });

  it('splits both axes when a second line exists', () => {
    const layout: Layout = [item('a', 0, 0), item('b', 1, 0), item('c', 0, 1)];
    expect(distributeEvenly(layout, { cols: 4, rows: 2 })).toEqual([
      { i: 'a', x: 0, y: 0, w: 2, h: 1 },
      { i: 'b', x: 2, y: 0, w: 2, h: 1 },
      { i: 'c', x: 0, y: 1, w: 4, h: 1 },
    ]);
  });

  it('gives the remainder columns to the leftmost cells of a line', () => {
    const layout: Layout = [item('a', 0, 0), item('b', 1, 0)];
    const [a, b] = distributeEvenly(layout, { cols: 5, rows: 1 });
    expect(a).toMatchObject({ x: 0, w: 3 });
    expect(b).toMatchObject({ x: 3, w: 2 });
  });

  it('wraps a line wider than the grid instead of tiling past the edge', () => {
    // Four items on one line in a 2-column grid: they wrap onto two sub-rows
    // rather than overflowing to the right and overlapping once clamped.
    const layout: Layout = [
      item('a', 0, 0),
      item('b', 1, 0),
      item('c', 2, 0),
      item('d', 3, 0),
    ];
    const out = distributeEvenly(layout, { cols: 2, rows: 2 });
    for (const it of out) {
      expect(it.x + it.w).toBeLessThanOrEqual(2);
    }
    expect(new Set(out.map((it) => it.y)).size).toBe(2);
  });

  it('preserves the input order, so a positional diff stays stable', () => {
    const layout: Layout = [item('c', 0, 1), item('a', 0, 0), item('b', 1, 0)];
    expect(
      distributeEvenly(layout, { cols: 2, rows: 2 }).map((it) => it.i),
    ).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input', () => {
    const original = item('a', 3, 4, 1, 1);
    distributeEvenly([original], { cols: 4, rows: 4 });
    expect(original).toEqual({ i: 'a', x: 3, y: 4, w: 1, h: 1 });
  });
});
