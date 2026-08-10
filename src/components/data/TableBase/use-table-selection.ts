import { SelectionManager } from '@react-stately/selection';
import { useCallback, useMemo, useRef } from 'react';
import { useMultipleSelectionState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks';

import { RowCollection } from './RowCollection';

import type { Key, Selection } from '@react-types/shared';
import type { CubeTableSelectAllMode, CubeTableSelectionMode } from './types';

/**
 * Reserved key for the checkbox column. Prefixed so it cannot collide with a
 * real data key, and structural so the value pipeline, sorting and search all
 * skip it.
 */
export const SELECTION_COLUMN_KEY = '__cube-selection__';

/** Reserved key for the row-number column. Structural, like the checkbox. */
export const ROW_NUMBER_COLUMN_KEY = '__cube-row-number__';

/** Square-ish, so the checkbox sits centred without stealing content width. */
export const SELECTION_COLUMN_WIDTH: Record<string, number> = {
  xsmall: 32,
  small: 36,
  medium: 44,
  large: 48,
  xlarge: 52,
};

export interface UseTableSelectionOptions<T> {
  /** Rows currently on screen — one page, or everything when unpaginated. */
  rows: readonly T[];
  /**
   * Every row passing the current search/filter, across pages. Only differs
   * from `rows` under client pagination, and only `selectAllMode="filtered"`
   * reads it.
   */
  filteredRows: readonly T[];
  getRowKey: (row: T, index: number) => Key;
  selectionMode: CubeTableSelectionMode;
  selectedKeys?: Key[] | 'all';
  defaultSelectedKeys?: Key[] | 'all';
  onSelectionChange?: (keys: Key[] | 'all', rows: T[]) => void;
  selectAllMode: CubeTableSelectAllMode;
  isRowSelectable?: (row: T) => boolean;
  disabledKeys?: Key[];
}

export type CubeTableSelectAllState = 'none' | 'some' | 'all';

function toSelection(keys: Key[] | 'all' | undefined): Selection | undefined {
  if (keys === undefined) return undefined;

  return keys === 'all' ? 'all' : new Set(keys);
}

export function useTableSelection<T>(options: UseTableSelectionOptions<T>) {
  const {
    rows,
    filteredRows,
    getRowKey,
    selectionMode,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode,
    isRowSelectable,
    disabledKeys,
  } = options;

  const isEnabled = selectionMode !== 'none';

  /**
   * Two distinct notions of "not available", deliberately kept apart:
   *
   * - `disabledKeys` — the row is inert. Not focusable, not interactive. This
   *   is React Aria's standard meaning.
   * - `isRowSelectable` — the row is fully interactive, only its checkbox is
   *   inert. This is what Cloud's tables do today.
   *
   * A `SelectionManager` has one `disabledBehavior`, so it gets the union under
   * `'selection'` (neither kind can be selected) and the hard-disabled set is
   * tracked separately for focus and interaction.
   */
  const hardDisabledKeys = useMemo(
    () => new Set(disabledKeys ?? []),
    [disabledKeys],
  );

  const unselectableKeys = useMemo(() => {
    const keys = new Set(hardDisabledKeys);

    if (isRowSelectable) {
      // Scanned over the filtered set, not just the page: a select-all that
      // reaches beyond the page must respect it there too.
      filteredRows.forEach((row, index) => {
        if (!isRowSelectable(row)) keys.add(getRowKey(row, index));
      });
    }

    return keys;
  }, [hardDisabledKeys, isRowSelectable, filteredRows, getRowKey]);

  const collection = useMemo(
    () => new RowCollection(rows, getRowKey, unselectableKeys),
    [rows, getRowKey, unselectableKeys],
  );

  const rowByKey = useMemo(() => {
    const map = new Map<Key, T>();

    // The page first, then the wider filtered set, so a key present in both
    // resolves to the row the user can actually see.
    filteredRows.forEach((row, index) => map.set(getRowKey(row, index), row));
    rows.forEach((row, index) => map.set(getRowKey(row, index), row));

    return map;
  }, [rows, filteredRows, getRowKey]);

  const rowByKeyRef = useRef(rowByKey);

  rowByKeyRef.current = rowByKey;

  /**
   * Where a shift-range starts, and how far it currently reaches.
   *
   * React Aria's `SelectionManager.extendSelection` keeps this on the `Selection`
   * object itself (`selectedKeys.anchorKey`), which cannot survive our public
   * API: `selectedKeys` is `Key[]`, and `useMultipleSelectionState` rebuilds
   * whatever it is given with `new Selection(value)` — a constructor that only
   * copies the anchor when the input is already a `Selection`, a class no
   * package exports. A controlled table would silently reset the anchor to the
   * clicked row and turn every shift-click into a plain toggle.
   *
   * So the range is computed here instead, over `RowCollection`'s index. The
   * semantics match `extendSelection` exactly: the previous range is removed
   * before the new one is added, so shift-clicking back shrinks the range
   * rather than leaving the overshoot selected.
   */
  const anchorRef = useRef<Key | null>(null);
  const extentRef = useRef<Key | null>(null);

  const handleSelectionChange = useEvent((keys: Selection) => {
    if (!onSelectionChange) return;

    if (keys === 'all') {
      // The sentinel means "everything, including rows the client has not
      // loaded", so the row list can only ever be what is loaded.
      onSelectionChange('all', [...rowByKeyRef.current.values()]);

      return;
    }

    const list = [...keys];

    onSelectionChange(
      list,
      list
        .map((key) => rowByKeyRef.current.get(key))
        .filter((row): row is T => row !== undefined),
    );
  });

  const controlledSelection = useMemo(
    () => toSelection(selectedKeysProp),
    [selectedKeysProp],
  );
  const defaultSelection = useMemo(
    () => toSelection(defaultSelectedKeys),
    [defaultSelectedKeys],
  );

  const state = useMultipleSelectionState({
    selectionMode,
    selectedKeys: controlledSelection,
    defaultSelectedKeys: defaultSelection,
    disabledKeys: unselectableKeys,
    disabledBehavior: 'selection',
    onSelectionChange: handleSelectionChange,
  });

  const selectionManager = useMemo(
    () => new SelectionManager(collection, state),
    [collection, state],
  );

  const selectedKeys = state.selectedKeys;
  const isAll = selectedKeys === 'all';

  const canSelect = useCallback(
    (key: Key) => isEnabled && !unselectableKeys.has(key),
    [isEnabled, unselectableKeys],
  );

  const isSelected = useCallback(
    (key: Key) =>
      isAll ? canSelect(key) : (selectedKeys as Set<Key>).has(key),
    [isAll, selectedKeys, canSelect],
  );

  /** Keys the header checkbox acts on, which is what `selectAllMode` decides. */
  const scopeKeys = useMemo(() => {
    if (!isEnabled || selectionMode === 'single') return [];

    const source = selectAllMode === 'page' ? rows : filteredRows;

    return source
      .map((row, index) => getRowKey(row, index))
      .filter((key) => !unselectableKeys.has(key));
  }, [
    isEnabled,
    selectionMode,
    selectAllMode,
    rows,
    filteredRows,
    getRowKey,
    unselectableKeys,
  ]);

  const selectAllState: CubeTableSelectAllState = useMemo(() => {
    if (isAll) return 'all';
    if (!scopeKeys.length) return 'none';

    const set = selectedKeys as Set<Key>;
    let count = 0;

    for (const key of scopeKeys) if (set.has(key)) count++;

    return count === 0 ? 'none' : count === scopeKeys.length ? 'all' : 'some';
  }, [isAll, selectedKeys, scopeKeys]);

  const toggleSelectAll = useEvent(() => {
    anchorRef.current = null;
    extentRef.current = null;

    if (selectAllState === 'all') {
      // Clearing drops the whole selection, not just the scope: leaving keys
      // selected on other pages after the user clicked an unchecked-looking
      // box is the kind of thing nobody discovers until they delete something.
      state.setSelectedKeys(new Set());

      return;
    }

    if (selectAllMode === 'all') {
      state.setSelectedKeys('all');

      return;
    }

    const next = new Set(isAll ? [] : (selectedKeys as Set<Key>));

    scopeKeys.forEach((key) => next.add(key));
    state.setSelectedKeys(next);
  });

  const clearSelection = useEvent(() => {
    anchorRef.current = null;
    extentRef.current = null;
    state.setSelectedKeys(new Set());
  });

  /**
   * Shift held on the press that produced this change. `Checkbox` reports only
   * the next value, so the modifier is captured from the pointer/key event on
   * the cell and read back here.
   */
  const shiftRef = useRef(false);

  const captureShift = useCallback((event: { shiftKey: boolean }) => {
    shiftRef.current = event.shiftKey;
  }, []);

  /** Selectable keys between two rows, inclusive, in either direction. */
  const keysBetween = useCallback(
    (from: Key, to: Key) => {
      const fromIndex = collection.indexOf(from);
      const toIndex = collection.indexOf(to);

      if (fromIndex < 0 || toIndex < 0) return [];

      const [lo, hi] =
        fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
      const all = collection.getKeys();
      const range: Key[] = [];

      for (let i = lo; i <= hi; i++) range.push(all[i]);

      return range;
    },
    [collection],
  );

  const toggleRow = useEvent((key: Key) => {
    if (!canSelect(key)) return;

    if (selectionMode === 'single') {
      state.setSelectedKeys(isSelected(key) ? new Set() : new Set([key]));

      return;
    }

    const anchor = anchorRef.current;

    if (shiftRef.current && anchor != null && collection.indexOf(anchor) >= 0) {
      const next = new Set(isAll ? scopeKeys : (selectedKeys as Set<Key>));

      // Drop the range this shift-click supersedes before drawing the new one,
      // so clicking back toward the anchor shrinks the selection.
      if (extentRef.current != null) {
        keysBetween(anchor, extentRef.current).forEach((k) => next.delete(k));
      }

      keysBetween(anchor, key).forEach((k) => {
        if (canSelect(k)) next.add(k);
      });

      extentRef.current = key;
      state.setSelectedKeys(next);

      return;
    }

    anchorRef.current = key;
    extentRef.current = null;
    selectionManager.toggleSelection(key);
  });

  const selectedRows = useMemo(() => {
    if (isAll) return [...rowByKey.values()];

    return [...(selectedKeys as Set<Key>)]
      .map((key) => rowByKey.get(key))
      .filter((row): row is T => row !== undefined);
  }, [isAll, selectedKeys, rowByKey]);

  return {
    isEnabled,
    selectionMode,
    selectionManager,
    collection,
    isSelected,
    canSelect,
    isRowDisabled: useCallback(
      (key: Key) => hardDisabledKeys.has(key),
      [hardDisabledKeys],
    ),
    toggleRow,
    captureShift,
    selectAllState,
    toggleSelectAll,
    clearSelection,
    selectedRows,
    selectedCount: isAll ? rowByKey.size : (selectedKeys as Set<Key>).size,
    selectedKeys: (isAll ? 'all' : [...(selectedKeys as Set<Key>)]) as
      | Key[]
      | 'all',
  };
}

export type CubeTableSelectionState<T> = ReturnType<
  typeof useTableSelection<T>
>;
