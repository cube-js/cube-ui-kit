import { useCollator } from '@react-aria/i18n';
import { useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { sortTableTree } from '../TableBase/table-tree';
import { compareByColumn, useTableSort } from '../TableBase/use-table-sort';

import type { FilteredTableTree } from '../TableBase/table-tree';
import type { CubeTableSort } from '../TableBase/types';
import type { CubeTableSortMode } from '../TableBase/use-table-sort';
import type { useTableStorage } from '../TableBase/use-table-storage';
import type { CubeItemTableColumn } from './types';

export interface UseItemTableSortOptions<T> {
  columns: CubeItemTableColumn<T>[];
  /** The searched flat rows. */
  rows: readonly T[];
  /** The searched tree; `null` outside tree mode. */
  tree: FilteredTableTree<T> | null;
  mode?: CubeTableSortMode;
  sort?: CubeTableSort | null;
  defaultSort?: CubeTableSort | null;
  onSortChange?: (sort: CubeTableSort | null) => void;
  storage: ReturnType<typeof useTableStorage>;
}

/**
 * The table's sort: its state, persisted when the table owns it, applied to
 * flat rows by `useTableSort` and to every level of a tree here.
 */
export function useItemTableSort<T>({
  columns,
  rows,
  tree,
  mode,
  sort: sortProp,
  defaultSort,
  onSortChange,
  storage,
}: UseItemTableSortOptions<T>) {
  const {
    sort,
    sortedRows,
    toggleSort,
    setColumnSort,
    mode: resolvedSortMode,
  } = useTableSort<T>({
    columns,
    rows: tree ? tree.roots.map((node) => node.row) : rows,
    mode: tree ? 'server' : mode,
    sort: sortProp,
    // Only restore what the table owns: a controlled `sort` belongs to the page,
    // and overriding it here would fight the page's own source of truth.
    defaultSort:
      sortProp === undefined && storage.has('sort')
        ? storage.initial.sort ?? defaultSort
        : defaultSort,
    onSortChange: useEvent((next: CubeTableSort | null) => {
      if (sortProp === undefined) storage.write({ sort: next });
      onSortChange?.(next);
    }),
  });

  const collator = useCollator({ numeric: true, sensitivity: 'base' });
  const treeSortMode = tree
    ? mode ?? (columns.some((column) => column.isSortable) ? 'client' : 'off')
    : resolvedSortMode;
  const sortedTreeRoots = useMemo(() => {
    const roots = tree?.roots ?? [];
    if (treeSortMode !== 'client' || !sort) return roots;
    const column = columns.find((entry) => entry.key === sort.columnKey);
    if (!column) return roots;

    return sortTableTree(roots, (a, b) => {
      const result = compareByColumn(
        column,
        collator,
        a.row,
        a.sourceIndex,
        b.row,
        b.sourceIndex,
      );
      return result * (sort.direction === 'asc' ? 1 : -1);
    });
  }, [tree, treeSortMode, sort, columns, collator]);

  return {
    sort,
    sortedRows,
    /** Empty outside tree mode. */
    sortedTreeRoots,
    mode: treeSortMode,
    toggleSort,
    setColumnSort,
  };
}
