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
  /** Stable keys parallel to `rows`, used by tree mode. */
  rowKeys?: readonly Key[];
  /** Full current-page subtree; defaults to `rows`. */
  pageRows?: readonly T[];
  /** Stable keys parallel to `pageRows`. */
  pageRowKeys?: readonly Key[];
  /**
   * Every row passing the current search/filter, across pages. Only differs
   * from `rows` under client pagination, and only `selectAllMode="filtered"`
   * reads it.
   */
  filteredRows: readonly T[];
  /** Stable keys parallel to `filteredRows`. */
  filteredRowKeys?: readonly Key[];
  getRowKey: (row: T, index: number) => Key;
  selectionMode: CubeTableSelectionMode;
  selectedKeys?: Key[] | 'all';
  defaultSelectedKeys?: Key[] | 'all';
  onSelectionChange?: (keys: Key[] | 'all', rows: T[]) => void;
  selectAllMode: CubeTableSelectAllMode;
  isRowSelectable?: (row: T) => boolean;
  disabledKeys?: Key[];
  tree?: {
    rootKeys: readonly Key[];
    childrenOf: ReadonlyMap<Key, readonly Key[]>;
    parentOf: ReadonlyMap<Key, Key | null>;
    behavior: 'cascade' | 'independent';
  };
}

export type CubeTableSelectAllState = 'none' | 'some' | 'all';

function toSelection(keys: Key[] | 'all' | undefined): Selection | undefined {
  if (keys === undefined) return undefined;

  return keys === 'all' ? 'all' : new Set(keys);
}

function deriveTreeSelection(
  source: ReadonlySet<Key>,
  rootKeys: readonly Key[],
  childrenOf: ReadonlyMap<Key, readonly Key[]>,
  isEligible: (key: Key) => boolean,
) {
  const checked = new Set(source);
  const indeterminate = new Set<Key>();

  const visit = (
    key: Key,
    inheritedSelection = false,
  ): { all: boolean; any: boolean; eligible: boolean } => {
    const children = childrenOf.get(key) ?? [];
    const eligible = isEligible(key);
    const selectsBranch = inheritedSelection || (eligible && source.has(key));

    if (eligible && selectsBranch) checked.add(key);

    if (!children.length) {
      const selected = eligible && checked.has(key);
      if (!eligible) checked.delete(key);
      return { all: !eligible || selected, any: selected, eligible };
    }

    let all = true;
    let any = false;
    let hasEligible = false;

    for (const child of children) {
      const result = visit(child, selectsBranch);
      if (result.eligible) hasEligible = true;
      if (!result.all) all = false;
      if (result.any) any = true;
    }

    if (!eligible) {
      checked.delete(key);
      indeterminate.delete(key);
    } else if (hasEligible && all) {
      checked.add(key);
      indeterminate.delete(key);
    } else if (hasEligible && any) {
      checked.delete(key);
      indeterminate.add(key);
    } else if (!checked.has(key)) {
      indeterminate.delete(key);
    }

    return {
      all: !eligible || (checked.has(key) && all),
      any: any || checked.has(key),
      eligible: eligible || hasEligible,
    };
  };

  rootKeys.forEach((key) => visit(key));
  return { checked, indeterminate };
}

export function useTableSelection<T>(options: UseTableSelectionOptions<T>) {
  const {
    rows,
    rowKeys,
    pageRows = rows,
    pageRowKeys,
    filteredRows,
    filteredRowKeys,
    getRowKey,
    selectionMode,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode,
    isRowSelectable,
    disabledKeys,
    tree,
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
        if (!isRowSelectable(row)) {
          keys.add(filteredRowKeys?.[index] ?? getRowKey(row, index));
        }
      });
    }

    return keys;
  }, [
    hardDisabledKeys,
    isRowSelectable,
    filteredRows,
    filteredRowKeys,
    getRowKey,
  ]);

  const visibleGetRowKey = useCallback(
    (row: T, index: number) => rowKeys?.[index] ?? getRowKey(row, index),
    [rowKeys, getRowKey],
  );

  const collection = useMemo(
    () => new RowCollection(rows, visibleGetRowKey, unselectableKeys),
    [rows, visibleGetRowKey, unselectableKeys],
  );

  const rowByKey = useMemo(() => {
    const map = new Map<Key, T>();

    // The page first, then the wider filtered set, so a key present in both
    // resolves to the row the user can actually see.
    filteredRows.forEach((row, index) =>
      map.set(filteredRowKeys?.[index] ?? getRowKey(row, index), row),
    );
    rows.forEach((row, index) =>
      map.set(rowKeys?.[index] ?? getRowKey(row, index), row),
    );

    return map;
  }, [rows, rowKeys, filteredRows, filteredRowKeys, getRowKey]);

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
  const isCascade =
    tree?.behavior === 'cascade' && selectionMode === 'multiple';

  const derivedSelection = useMemo(() => {
    if (isAll) {
      return {
        checked: new Set(
          [...rowByKey.keys()].filter((key) => !unselectableKeys.has(key)),
        ),
        indeterminate: new Set<Key>(),
      };
    }

    if (!isCascade || !tree) {
      return {
        checked: new Set(selectedKeys as Set<Key>),
        indeterminate: new Set<Key>(),
      };
    }

    return deriveTreeSelection(
      selectedKeys as Set<Key>,
      tree.rootKeys,
      tree.childrenOf,
      (key) => !unselectableKeys.has(key),
    );
  }, [isAll, isCascade, selectedKeys, tree, rowByKey, unselectableKeys]);

  const canSelect = useCallback(
    (key: Key) => isEnabled && !unselectableKeys.has(key),
    [isEnabled, unselectableKeys],
  );

  const isSelected = useCallback(
    (key: Key) => (isAll ? canSelect(key) : derivedSelection.checked.has(key)),
    [isAll, derivedSelection, canSelect],
  );

  const isIndeterminate = useCallback(
    (key: Key) => derivedSelection.indeterminate.has(key),
    [derivedSelection],
  );

  /** Keys the header checkbox acts on, which is what `selectAllMode` decides. */
  const scopeKeys = useMemo(() => {
    if (!isEnabled || selectionMode === 'single') return [];

    const source = selectAllMode === 'page' ? pageRows : filteredRows;
    const sourceKeys = selectAllMode === 'page' ? pageRowKeys : filteredRowKeys;

    return source
      .map((row, index) => sourceKeys?.[index] ?? getRowKey(row, index))
      .filter((key) => !unselectableKeys.has(key));
  }, [
    isEnabled,
    selectionMode,
    selectAllMode,
    pageRows,
    pageRowKeys,
    filteredRows,
    filteredRowKeys,
    getRowKey,
    unselectableKeys,
  ]);

  const selectAllState: CubeTableSelectAllState = useMemo(() => {
    if (isAll) return 'all';
    if (!scopeKeys.length) return 'none';

    const set = derivedSelection.checked;
    let count = 0;

    for (const key of scopeKeys) if (set.has(key)) count++;

    return count === 0 ? 'none' : count === scopeKeys.length ? 'all' : 'some';
  }, [isAll, derivedSelection, scopeKeys]);

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

    const next = new Set(isAll ? [] : derivedSelection.checked);

    scopeKeys.forEach((key) => next.add(key));
    state.setSelectedKeys(
      isCascade && tree
        ? deriveTreeSelection(
            next,
            tree.rootKeys,
            tree.childrenOf,
            (key) => !unselectableKeys.has(key),
          ).checked
        : next,
    );
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

    const applyCascade = (set: Set<Key>, target: Key, value: boolean) => {
      if (!canSelect(target)) return;
      if (value) set.add(target);
      else {
        set.delete(target);

        // A checked ancestor in the normalized public key set means its whole
        // branch is selected. Remove that derived marker before normalizing a
        // partial deselection, or it would immediately select the child again.
        if (isCascade && tree) {
          let parent = tree.parentOf.get(target);
          while (parent != null) {
            set.delete(parent);
            parent = tree.parentOf.get(parent);
          }
        }
      }
      if (!isCascade || !tree) return;
      (tree.childrenOf.get(target) ?? []).forEach((child) =>
        applyCascade(set, child, value),
      );
    };

    const normalizeCascade = (set: Set<Key>) =>
      isCascade && tree
        ? deriveTreeSelection(
            set,
            tree.rootKeys,
            tree.childrenOf,
            (candidate) => !unselectableKeys.has(candidate),
          ).checked
        : set;

    const anchor = anchorRef.current;

    if (shiftRef.current && anchor != null && collection.indexOf(anchor) >= 0) {
      const next = new Set(isAll ? scopeKeys : derivedSelection.checked);

      // Drop the range this shift-click supersedes before drawing the new one,
      // so clicking back toward the anchor shrinks the selection.
      if (extentRef.current != null) {
        keysBetween(anchor, extentRef.current).forEach((k) =>
          applyCascade(next, k, false),
        );
      }

      keysBetween(anchor, key).forEach((k) => {
        applyCascade(next, k, true);
      });

      extentRef.current = key;
      state.setSelectedKeys(normalizeCascade(next));

      return;
    }

    anchorRef.current = key;
    extentRef.current = null;
    if (isCascade) {
      const next = new Set(derivedSelection.checked);
      applyCascade(next, key, !derivedSelection.checked.has(key));
      state.setSelectedKeys(normalizeCascade(next));
    } else {
      selectionManager.toggleSelection(key);
    }
  });

  const selectedRows = useMemo(() => {
    if (isAll) return [...rowByKey.values()];

    return [...derivedSelection.checked]
      .map((key) => rowByKey.get(key))
      .filter((row): row is T => row !== undefined);
  }, [isAll, derivedSelection, rowByKey]);

  return {
    isEnabled,
    selectionMode,
    selectionManager,
    collection,
    isSelected,
    isIndeterminate,
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
    selectedCount: isAll ? rowByKey.size : derivedSelection.checked.size,
    selectedKeys: (isAll ? 'all' : [...derivedSelection.checked]) as
      | Key[]
      | 'all',
  };
}

export type CubeTableSelectionState<T> = ReturnType<
  typeof useTableSelection<T>
>;
