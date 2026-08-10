import { useControlledState } from '@react-stately/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [committed, setCommitted] = useControlledState<string>(
    value as string,
    defaultValue ?? '',
    onChange as (v: string) => void,
  );

  // What the input shows, updated on every keystroke. The committed value —
  // the one `onChange` reports and the filter runs on — trails it by `delay`.
  //
  // Two separate values rather than one, because `useControlledState` calls
  // `onChange` the moment it is set: routing keystrokes straight into it fired
  // a request per character in `searchMode="server"`, which is the thing the
  // debounce exists to prevent. Debouncing the input itself instead would make
  // typing lag, so the split is the point.
  const [draft, setDraft] = useState(committed);
  const debounced = useDebouncedValue(draft, delay);

  // What we last pushed outward, so the sync below can tell a genuine external
  // change from the echo of our own debounce.
  const pushedRef = useRef(committed);

  // A controlled `searchValue` changing from OUTSIDE — a cleared filter, a
  // restored URL — wins over whatever is half-typed.
  //
  // The echo has to be filtered out or this reverts the input mid-word: with a
  // short delay the debounce commits letter 1 while letter 2 is already typed,
  // and syncing unconditionally puts letter 1 back. At `searchDelay={0}` that
  // happens on every keystroke and nothing longer than one character can ever
  // be typed.
  useEffect(() => {
    if (committed === pushedRef.current) return;

    pushedRef.current = committed;
    setDraft(committed);
  }, [committed]);

  useEffect(() => {
    if (debounced === pushedRef.current) return;

    pushedRef.current = debounced;
    setCommitted(debounced);
    // `committed` is deliberately not a dependency: reacting to it here would
    // fight the effect above and push a stale draft back out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const searchValue = draft;
  const query = debounced.trim().toLowerCase();

  const setSearchValue = useEvent((next: string) => setDraft(next));

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
