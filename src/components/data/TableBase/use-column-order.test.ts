import {
  applyColumnOrder,
  getDraggableColumnKeys,
  isColumnDraggable,
  projectReorder,
} from './use-column-order';

import type { CubeResolvedColumn, CubeTableColumn } from './types';

const cols = (...keys: string[]): CubeTableColumn[] =>
  keys.map((key) => ({ key }));
const keysOf = (columns: CubeTableColumn[]) =>
  columns.map((column) => column.key);

const resolved = (
  key: string,
  extra: Partial<CubeResolvedColumn> = {},
): CubeResolvedColumn =>
  ({
    key,
    isStructural: false,
    pin: undefined,
    ...extra,
  }) as CubeResolvedColumn;

describe('applyColumnOrder', () => {
  it('leaves the source order alone without an order', () => {
    const columns = cols('a', 'b', 'c');

    expect(applyColumnOrder(columns)).toBe(columns);
    expect(applyColumnOrder(columns, [])).toBe(columns);
  });

  it('reorders to match', () => {
    expect(
      keysOf(applyColumnOrder(cols('a', 'b', 'c'), ['c', 'a', 'b'])),
    ).toEqual(['c', 'a', 'b']);
  });

  it('ignores a key whose column is gone', () => {
    expect(
      keysOf(applyColumnOrder(cols('a', 'b'), ['b', 'removed', 'a'])),
    ).toEqual(['b', 'a']);
  });

  it('keeps a duplicated key at its first position', () => {
    expect(keysOf(applyColumnOrder(cols('a', 'b'), ['b', 'a', 'b']))).toEqual([
      'b',
      'a',
    ]);
  });

  it('lands a new column after the neighbour it had', () => {
    // `b` is new — it was not in the persisted order. Sweeping it to the end
    // would be the easy implementation and the wrong result: it belongs where
    // the developer put it, which is after `a`.
    expect(keysOf(applyColumnOrder(cols('a', 'b', 'c'), ['c', 'a']))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('keeps a new leading column leading', () => {
    expect(keysOf(applyColumnOrder(cols('new', 'a', 'b'), ['b', 'a']))).toEqual(
      ['new', 'b', 'a'],
    );
  });

  it('keeps several new columns in their source order', () => {
    expect(
      keysOf(applyColumnOrder(cols('a', 'x', 'y', 'b'), ['b', 'a'])),
    ).toEqual(['b', 'a', 'x', 'y']);
  });

  it('is a no-op when no key in the order still exists', () => {
    const columns = cols('a', 'b');

    expect(applyColumnOrder(columns, ['gone', 'also-gone'])).toBe(columns);
  });
});

describe('isColumnDraggable', () => {
  it('is off unless the table enables it', () => {
    expect(isColumnDraggable(resolved('a'), false)).toBe(false);
    expect(isColumnDraggable(resolved('a'), true)).toBe(true);
  });

  it('excludes structural columns', () => {
    expect(isColumnDraggable(resolved('a', { isStructural: true }), true)).toBe(
      false,
    );
  });

  it.each(['start', 'end'] as const)('excludes a %s-pinned column', (pin) => {
    // `pin` already decides where the column sits, and a sticky `<th>` breaks
    // the drop-target search under horizontal scroll.
    expect(isColumnDraggable(resolved('a', { pin }), true)).toBe(false);
  });

  it('honours a per-column opt-out', () => {
    expect(
      isColumnDraggable(resolved('a', { isReorderable: false }), true),
    ).toBe(false);
    expect(
      isColumnDraggable(resolved('a', { isReorderable: true }), true),
    ).toBe(true);
  });

  it('lists only the draggable keys', () => {
    const columns = [
      resolved('sel', { isStructural: true }),
      resolved('a', { pin: 'start' }),
      resolved('b'),
      resolved('c', { isReorderable: false }),
      resolved('d'),
    ];

    expect(getDraggableColumnKeys(columns, true)).toEqual(['b', 'd']);
    expect(getDraggableColumnKeys(columns, false)).toEqual([]);
  });
});

describe('projectReorder', () => {
  it('rewrites only the draggable slots', () => {
    // `pinned` and `hidden` never moved, so they must keep their absolute index
    // even though the drag reordered everything around them.
    expect(
      projectReorder(['pinned', 'a', 'hidden', 'b', 'c'], ['c', 'b', 'a']),
    ).toEqual(['pinned', 'c', 'hidden', 'b', 'a']);
  });

  it('is a no-op when the subset is unchanged', () => {
    expect(projectReorder(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('leaves a full order with no draggable keys untouched', () => {
    expect(projectReorder(['a', 'b'], [])).toEqual(['a', 'b']);
  });
});
