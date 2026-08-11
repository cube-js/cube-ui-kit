import { useControlledState } from '@react-stately/utils';
import { useMemo, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import type { CubeResolvedColumn, CubeTableColumn } from './types';
import type { useTableStorage } from './use-table-storage';

/**
 * Reorders the source columns to match `order`.
 *
 * Rank-based rather than filter-then-concat, because `order` is routinely
 * *stale*: it was persisted or lifted into page state before the current
 * `columns` array existed. A column missing from it inherits the rank of the
 * nearest preceding known column plus a half step, so it lands immediately after
 * the neighbour it had in the source array instead of being swept to the end. A
 * new leading column keeps its lead.
 *
 * Applied to the SOURCE array, before `useTableColumns` — so hidden-column
 * filtering, structural injection, pinned hoisting and `aria-colindex` all still
 * happen downstream, and `columnOrder` can never fight `pin`.
 */
export function applyColumnOrder<T>(
  columns: CubeTableColumn<T>[],
  order?: readonly string[],
): CubeTableColumn<T>[] {
  if (!order?.length) return columns;

  const present = new Set(columns.map((column) => column.key));
  const rank = new Map<string, number>();

  order.forEach((key, index) => {
    // A key for a column that no longer exists is ignored rather than treated as
    // a gap, and a duplicate keeps its first position.
    if (present.has(key) && !rank.has(key)) rank.set(key, index);
  });

  if (!rank.size) return columns;

  let carried = -1;

  return columns
    .map((column, sourceIndex) => {
      const own = rank.get(column.key);

      if (own != null) carried = own;

      return { column, sourceIndex, rank: own ?? carried + 0.5 };
    })
    .sort((a, b) => a.rank - b.rank || a.sourceIndex - b.sourceIndex)
    .map((entry) => entry.column);
}

/**
 * Whether a column can be picked up and moved.
 *
 * The single shared predicate: `DataTable` builds the draggable key list from
 * it and `TableView` decides which `<th>` is a drag source from it, so the two
 * cannot drift. A renderer disagreeing with the state behind it is exactly how
 * the drop indicator that never matched its selector happened.
 *
 * Pinned columns are excluded, for three reasons that all point the same way: a
 * pinned `<th>` is `position: sticky`, so under horizontal scroll its rect sits
 * on top of columns it is nowhere near and React Aria's drop-target binary
 * search goes wrong; `use-table-columns` hoists pinned columns to the edges
 * regardless of source order, so a cross-boundary drop would be undone
 * immediately; and `pin` is already the ordering authority there. What that buys
 * is a draggable set that is one contiguous, non-sticky run — every permutation
 * of which stays monotonic, which is what the delegate needs.
 */
export function isColumnDraggable<T>(
  column: Pick<CubeResolvedColumn<T>, 'isStructural' | 'pin' | 'isReorderable'>,
  isEnabled: boolean,
): boolean {
  return (
    isEnabled &&
    !column.isStructural &&
    column.pin == null &&
    (column.isReorderable ?? true)
  );
}

export function getDraggableColumnKeys<T>(
  columns: readonly CubeResolvedColumn<T>[],
  isEnabled: boolean,
): string[] {
  return columns
    .filter((column) => isColumnDraggable(column, isEnabled))
    .map((column) => column.key);
}

/**
 * Folds a permutation of the draggable subset back into the full order.
 *
 * Only the slots the draggable keys already occupy are rewritten, so a hidden
 * column, a pinned one, or one that opted out keeps its absolute index and
 * cannot be displaced by a drag it took no part in.
 *
 * The visible consequence, worth knowing: a hidden column between two draggable
 * ones keeps its slot rather than following a neighbour, so it may come back
 * between different columns than it left. Predictable beats clever.
 */
export function projectReorder(
  fullOrder: readonly string[],
  nextDraggable: readonly string[],
): string[] {
  const draggable = new Set(nextDraggable);
  const next = [...fullOrder];
  let cursor = 0;

  for (let slot = 0; slot < next.length; slot++) {
    if (draggable.has(next[slot])) next[slot] = nextDraggable[cursor++];
  }

  return next;
}

const EMPTY_ORDER: string[] = [];

export interface UseColumnOrderOptions<T> {
  columns: CubeTableColumn<T>[];
  columnOrder?: string[];
  defaultColumnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  storage: ReturnType<typeof useTableStorage>;
}

export interface UseColumnOrderResult<T> {
  /** `columns`, reordered. Feed this to `useTableColumns`. */
  columns: CubeTableColumn<T>[];
  /** The full key list in its current order, including hidden and pinned keys. */
  order: string[];
  /** Takes the reordered DRAGGABLE keys and commits the full order. */
  reorder: (nextDraggable: string[]) => void;
}

export function useColumnOrder<T>({
  columns,
  columnOrder,
  defaultColumnOrder,
  onColumnOrderChange,
  storage,
}: UseColumnOrderOptions<T>): UseColumnOrderResult<T> {
  // Seeded once, like `ownColumnWidths`: a controlled `columnOrder` belongs to
  // the page, so restoring over it would fight the page's own source of truth.
  const [storedOrder] = useState(() =>
    columnOrder === undefined && storage.has('columnOrder')
      ? storage.initial.columnOrder
      : undefined,
  );

  // An empty array means "no order", which `applyColumnOrder` treats as a
  // no-op — same shape `useTableSorts` uses for its own empty default, and it
  // keeps `useControlledState` off the `undefined` overload.
  const [order, setOrder] = useControlledState<string[]>(
    columnOrder as string[],
    defaultColumnOrder ?? storedOrder ?? EMPTY_ORDER,
    onColumnOrderChange as (value: string[]) => void,
  );

  const ordered = useMemo(
    () => applyColumnOrder(columns, order),
    [columns, order],
  );

  // Always the FULL source key list, in current order — so a key never drops out
  // of persisted state just because its column happened to be hidden.
  const fullOrder = useMemo(
    () => ordered.map((column) => column.key),
    [ordered],
  );

  const reorder = useEvent((nextDraggable: string[]) => {
    const next = projectReorder(fullOrder, nextDraggable);

    setOrder(next);

    // Only what the table OWNS is persisted — a controlled order belongs to the
    // page, and storing it would fight the page on the next mount. Same rule
    // `handleColumnResizeEnd` follows for widths.
    if (columnOrder === undefined) storage.write({ columnOrder: next });
  });

  return { columns: ordered, order: fullOrder, reorder };
}
