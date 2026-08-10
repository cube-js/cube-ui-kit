import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';

import { useDebouncedValue, useEvent } from '../../../_internal/hooks';

import { getColumnText } from './use-table-columns';

import type { CubeTableColumn } from './types';

export type CubeTableSearchMode = 'client' | 'server';

export interface UseTableSearchOptions<T> {
  columns: CubeTableColumn<T>[];
  rows: readonly T[];
  /** @default 'client' */
  mode?: CubeTableSearchMode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Debounces the filter AND the callback, in both modes. @default 500 */
  delay?: number;
  /** Replaces the default matcher in client mode. */
  filter?: (row: T, query: string) => boolean;
}

export interface UseTableSearchResult<T> {
  /** The immediate term — what the input shows. */
  searchValue: string;
  setSearchValue: (value: string) => void;
  /** The debounced term — what the filter and the callback act on. */
  query: string;
  /** Filtered in client mode; the original array otherwise. */
  searchedRows: readonly T[];
  /** `true` when a non-empty term is narrowing the data. */
  isFiltered: boolean;
}

/**
 * Default matcher: a case-insensitive substring test against each searchable
 * column's **display text**.
 *
 * Deliberately not the raw value. Cloud's filter tested
 * `String(row[column.key])`, which meant a column rendering `owner.profile.name`
 * was unsearchable, and an object-valued column stringified to
 * `"[object Object]"` — so the query "object" matched every row with a nested
 * value. `getColumnText` returns `null` for anything it cannot honestly turn
 * into text, and those columns are skipped rather than coerced.
 */
function defaultMatcher<T>(
  columns: CubeTableColumn<T>[],
  row: T,
  rowIndex: number,
  query: string,
): boolean {
  return columns.some((column) => {
    if (column.isSearchable === false) return false;

    const text = getColumnText(column, row, rowIndex);

    return text != null && text.toLowerCase().includes(query);
  });
}

export function useTableSearch<T>({
  columns,
  rows,
  mode = 'client',
  value,
  defaultValue,
  onChange,
  delay = 500,
  filter,
}: UseTableSearchOptions<T>): UseTableSearchResult<T> {
  const [searchValue, setSearchState] = useControlledState<string>(
    value as string,
    defaultValue ?? '',
    onChange as (v: string) => void,
  );

  // The input stays immediate; only the work is debounced. Cloud debounced the
  // server callback but ran the client filter on every keystroke.
  const query = useDebouncedValue(searchValue, delay).trim().toLowerCase();

  const setSearchValue = useEvent((next: string) => setSearchState(next));

  const searchedRows = useMemo(() => {
    if (mode !== 'client' || !query) return rows;

    return rows.filter((row, index) =>
      filter ? filter(row, query) : defaultMatcher(columns, row, index, query),
    );
  }, [mode, query, rows, columns, filter]);

  return {
    searchValue,
    setSearchValue,
    query,
    searchedRows,
    isFiltered: query.length > 0,
  };
}
