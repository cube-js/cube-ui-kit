import { useCollator } from '@react-aria/i18n';
import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks';

import { compareByColumn } from './use-table-sort';

import type {
  CubeTableColumn,
  CubeTableSort,
  CubeTableSortDirection,
} from './types';

export interface UseTableSortsOptions<T> {
  columns: CubeTableColumn<T>[];
  rows: readonly T[];
  mode?: 'client' | 'server' | 'off';
  sorts?: CubeTableSort[];
  defaultSorts?: CubeTableSort[];
  onSortsChange?: (sorts: CubeTableSort[]) => void;
}

const EMPTY: CubeTableSort[] = [];

/**
 * Multi-column sorting.
 *
 * `ItemTable` sorts by one column, which is right for a list. An analytical
 * grid is routinely ordered by one dimension and then another, and Cloud's
 * reports send an array of sorts to the query — so the order of the array is
 * the sort precedence, and it has to survive round-tripping.
 *
 * Clicking a header cycles that column `asc → desc → off` exactly as the single
 * version does; the difference is that it edits its entry in place rather than
 * replacing the whole sort, so the other columns keep their precedence.
 */
export function useTableSorts<T>({
  columns,
  rows,
  mode,
  sorts: sortsProp,
  defaultSorts,
  onSortsChange,
}: UseTableSortsOptions<T>) {
  const collator = useCollator({ numeric: true, sensitivity: 'base' });

  const [sorts, setSorts] = useControlledState<CubeTableSort[]>(
    sortsProp as CubeTableSort[],
    defaultSorts ?? EMPTY,
    onSortsChange as (value: CubeTableSort[]) => void,
  );

  const hasSortableColumn = columns.some((column) => column.isSortable);
  const resolvedMode = mode ?? (hasSortableColumn ? 'client' : 'off');

  const isSortable = useEvent(
    (column: CubeTableColumn<T>) =>
      resolvedMode !== 'off' && column.isSortable === true,
  );

  const toggleSort = useEvent((columnKey: string) => {
    const column = columns.find((entry) => entry.key === columnKey);

    if (!column || !isSortable(column)) return;

    const index = sorts.findIndex((entry) => entry.columnKey === columnKey);

    if (index === -1) {
      // Appended, not prepended: a newly sorted column is the least
      // significant, so the ordering the user already established still leads.
      setSorts([...sorts, { columnKey, direction: 'asc' }]);

      return;
    }

    const next = [...sorts];

    if (next[index].direction === 'asc') {
      next[index] = { columnKey, direction: 'desc' };
      setSorts(next);

      return;
    }

    if (column.disallowSortRemoval) {
      next[index] = { columnKey, direction: 'asc' };
      setSorts(next);

      return;
    }

    next.splice(index, 1);
    setSorts(next);
  });

  /**
   * Set one column's direction outright instead of advancing the cycle.
   *
   * The column menu's `sort-desc` has to reach `desc` in one step. Reaching it
   * by calling `toggleSort` twice cannot work here: under `disallowSortRemoval`
   * the cycle never leaves `asc`/`desc`, and a column that was unsorted would
   * be appended and then re-read, so every intermediate state is observable.
   *
   * Precedence is preserved — an already-sorted column keeps its slot, and a
   * newly sorted one is appended as the least significant, the same rule
   * `toggleSort` follows.
   */
  const setColumnSort = useEvent(
    (columnKey: string, direction: CubeTableSortDirection | null) => {
      const column = columns.find((entry) => entry.key === columnKey);

      if (!column || !isSortable(column)) return;

      const index = sorts.findIndex((entry) => entry.columnKey === columnKey);

      if (direction == null) {
        // `disallowSortRemoval` means the column is never *left* unsorted, so an
        // explicit clear is refused too rather than quietly re-sorting.
        if (index === -1 || column.disallowSortRemoval) return;

        const next = [...sorts];

        next.splice(index, 1);
        setSorts(next);

        return;
      }

      if (index === -1) {
        setSorts([...sorts, { columnKey, direction }]);

        return;
      }

      if (sorts[index].direction === direction) return;

      const next = [...sorts];

      next[index] = { columnKey, direction };
      setSorts(next);
    },
  );

  const sortedRows = useMemo(() => {
    if (resolvedMode !== 'client' || !sorts.length) return rows;

    const active = sorts
      .map((sort) => ({
        sort,
        column: columns.find((entry) => entry.key === sort.columnKey),
      }))
      .filter(
        (entry): entry is { sort: CubeTableSort; column: CubeTableColumn<T> } =>
          entry.column != null,
      );

    if (!active.length) return rows;

    // Not sorted in place: `rows` belongs to the caller and `sort` mutates.
    // The original index is carried so the result is stable when every sort
    // ties.
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        for (const { sort, column } of active) {
          const result = compareByColumn(
            column,
            collator,
            a.row,
            a.index,
            b.row,
            b.index,
          );

          if (result !== 0) {
            return result * (sort.direction === 'asc' ? 1 : -1);
          }
        }

        return a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [resolvedMode, sorts, rows, columns, collator]);

  /** Where a column sits in the precedence, 1-based. `0` when unsorted. */
  const sortRank = useEvent(
    (columnKey: string) =>
      sorts.findIndex((entry) => entry.columnKey === columnKey) + 1,
  );

  // Returned for the same reason as the single-column hook: the renderer needs
  // this exact answer to decide whether a header is clickable.
  return {
    sorts,
    sortedRows,
    toggleSort,
    setColumnSort,
    isSortable,
    sortRank,
    mode: resolvedMode,
  };
}
