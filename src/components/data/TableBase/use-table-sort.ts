import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';
import { useCollator } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';

import { getColumnText, getColumnValue } from './use-table-columns';

import type {
  CubeTableColumn,
  CubeTableSort,
  CubeTableSortDirection,
} from './types';

export type CubeTableSortMode = 'client' | 'server' | 'off';

export interface UseTableSortOptions<T> {
  columns: CubeTableColumn<T>[];
  rows: readonly T[];
  /** @default 'client' when any column is sortable, else 'off' */
  mode?: CubeTableSortMode;
  sort?: CubeTableSort | null;
  defaultSort?: CubeTableSort | null;
  onSortChange?: (sort: CubeTableSort | null) => void;
}

export interface UseTableSortResult<T> {
  sort: CubeTableSort | null;
  /** `rows` reordered in client mode; the original array otherwise. */
  sortedRows: readonly T[];
  /** Advances a column through the sort cycle. */
  toggleSort: (columnKey: string) => void;
  /**
   * Sets a column's direction outright. `null` clears it.
   *
   * For the column menu's reserved sort keys, which have to reach a specific
   * direction in one step rather than cycling to it.
   */
  setColumnSort: (
    columnKey: string,
    direction: CubeTableSortDirection | null,
  ) => void;
  isSortable: (column: CubeTableColumn<T>) => boolean;
  /**
   * The mode after defaulting. The renderer needs this exact answer to decide
   * whether a header is clickable, and deriving it a second time at the call
   * site is how `DataTable` ended up sorting on `defaultSorts` but ignoring
   * every click.
   */
  mode: CubeTableSortMode;
}

/**
 * Sort state plus, in client mode, the reordered rows.
 *
 * The cycle is tri-state — `asc → desc → unsorted` — matching ag-grid's default
 * `sortingOrder`, because losing the ability to get back to the source order is
 * a real loss when the source order is meaningful. `disallowSortRemoval` on a
 * column reduces it to `asc ↔ desc`.
 */
export function useTableSort<T>({
  columns,
  rows,
  mode,
  sort: sortProp,
  defaultSort,
  onSortChange,
}: UseTableSortOptions<T>): UseTableSortResult<T> {
  // A collator gives locale-correct, case-insensitive ordering — "Ä" sorts next
  // to "A" rather than after "Z", which a raw `<` comparison gets wrong.
  const collator = useCollator({ numeric: true, sensitivity: 'base' });

  const [sort, setSort] = useControlledState<CubeTableSort | null>(
    sortProp as CubeTableSort | null,
    defaultSort ?? null,
    onSortChange as (value: CubeTableSort | null) => void,
  );

  const hasSortableColumn = columns.some((column) => column.isSortable);
  const resolvedMode: CubeTableSortMode =
    mode ?? (hasSortableColumn ? 'client' : 'off');

  const isSortable = useEvent(
    (column: CubeTableColumn<T>) =>
      resolvedMode !== 'off' && column.isSortable === true,
  );

  const toggleSort = useEvent((columnKey: string) => {
    const column = columns.find((entry) => entry.key === columnKey);

    if (!column || !isSortable(column)) return;

    if (sort?.columnKey !== columnKey) {
      setSort({ columnKey, direction: 'asc' });

      return;
    }

    if (sort.direction === 'asc') {
      setSort({ columnKey, direction: 'desc' });

      return;
    }

    setSort(
      column.disallowSortRemoval ? { columnKey, direction: 'asc' } : null,
    );
  });

  /**
   * Set the column's direction outright instead of advancing the cycle — see
   * `use-table-sorts.ts` for why the column menu cannot reuse `toggleSort`.
   */
  const setColumnSort = useEvent(
    (columnKey: string, direction: CubeTableSortDirection | null) => {
      const column = columns.find((entry) => entry.key === columnKey);

      if (!column || !isSortable(column)) return;

      if (direction == null) {
        // Clearing a column that is not the sorted one is a no-op rather than a
        // reset, and `disallowSortRemoval` refuses the clear outright.
        if (sort?.columnKey !== columnKey || column.disallowSortRemoval) return;

        setSort(null);

        return;
      }

      if (sort?.columnKey === columnKey && sort.direction === direction) return;

      setSort({ columnKey, direction });
    },
  );

  const sortedRows = useMemo(() => {
    if (resolvedMode !== 'client' || !sort) return rows;

    const column = columns.find((entry) => entry.key === sort.columnKey);

    if (!column) return rows;

    const direction = sort.direction === 'asc' ? 1 : -1;

    // `map`/`sort`/`map` rather than sorting in place: `rows` is the caller's
    // array and `Array.prototype.sort` mutates. Carrying the original index also
    // makes the sort stable across engines.
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const result = compareByColumn(
          column,
          collator,
          a.row,
          a.index,
          b.row,
          b.index,
        );

        return result !== 0 ? result * direction : a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [resolvedMode, sort, rows, columns, collator]);

  // The resolved mode is returned rather than left for the caller to derive
  // again: the renderer needs the same answer to decide whether a header is
  // clickable, and two independent derivations drift.
  return {
    sort,
    sortedRows,
    toggleSort,
    setColumnSort,
    isSortable,
    mode: resolvedMode,
  };
}

export function compareByColumn<T>(
  column: CubeTableColumn<T>,
  collator: Intl.Collator,
  rowA: T,
  indexA: number,
  rowB: T,
  indexB: number,
): number {
  const valueA = getColumnValue(column, rowA, indexA);
  const valueB = getColumnValue(column, rowB, indexB);

  if (column.compare) return column.compare(valueA, valueB, rowA, rowB);

  // Nullish always sorts first, then gets flipped with the direction. Mixing
  // them into the value comparison instead produces an unstable order.
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return -1;
  if (valueB == null) return 1;

  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }
  if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
    return Number(valueA) - Number(valueB);
  }
  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() - valueB.getTime();
  }

  // Fall back to display text, so a column with a `format` sorts the way it
  // reads rather than the way it is stored.
  const textA = getColumnText(column, rowA, indexA) ?? String(valueA);
  const textB = getColumnText(column, rowB, indexB) ?? String(valueB);

  return collator.compare(textA, textB);
}
