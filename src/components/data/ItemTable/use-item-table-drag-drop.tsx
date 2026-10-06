import { useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { isTableTreeDescendant } from '../TableBase/table-tree';

import { ItemTableDragPreview } from './ItemTableDragPreview';

import type { Key } from '@react-types/shared';
import type { TableTreeModel } from '../TableBase/table-tree';
import type { CubeItemTableProps } from './types';

export interface UseItemTableDragDropOptions<T>
  extends Pick<
    CubeItemTableProps<T>,
    'onReorder' | 'dropOnRow' | 'getItemDragInfo'
  > {
  /** The rows on screen, in order. */
  rows: readonly T[];
  /** Keys parallel to `rows` in tree mode; flat rows use `getRowKey`. */
  rowKeys?: readonly Key[];
  getRowKey: (row: T, index: number) => Key;
  treeModel: TableTreeModel<T> | null;
  isReorderable: boolean;
}

/** The dragged keys whose ancestors are not being dragged as well. */
function getTopmostKeys(
  keys: Key[],
  parentOf: ReadonlyMap<Key, Key | null>,
): Key[] {
  const keySet = new Set(keys);

  return keys.filter((key) => {
    let parent = parentOf.get(key);
    while (parent != null) {
      if (keySet.has(parent)) return false;
      parent = parentOf.get(parent);
    }
    return true;
  });
}

/**
 * Row drag and drop: reordering flat rows, dropping rows onto a row, and the
 * preview under the cursor. Returns the props `DraggableCollection` takes for
 * them, each handler `undefined` while its feature is off, and whether any
 * feature is on.
 */
export function useItemTableDragDrop<T>({
  rows,
  rowKeys,
  getRowKey,
  treeModel,
  isReorderable,
  onReorder,
  dropOnRow,
  getItemDragInfo,
}: UseItemTableDragDropOptions<T>) {
  const orderedKeys = useMemo(
    () =>
      rows.map((row, index) =>
        String(rowKeys?.[index] ?? getRowKey(row, index)),
      ),
    [rows, rowKeys, getRowKey],
  );

  const handleReorder = useEvent((nextKeys: string[]) => {
    const byKey = new Map(
      rows.map((row, index) => [String(getRowKey(row, index)), row]),
    );

    onReorder?.(
      nextKeys,
      nextKeys
        .map((key) => byKey.get(key))
        .filter((row): row is T => row !== undefined),
    );
  });

  const rowByKeyForDrop = useMemo(() => {
    const map = new Map<string, T>();

    rows.forEach((row, index) =>
      map.set(String(rowKeys?.[index] ?? getRowKey(row, index)), row),
    );

    return map;
  }, [rows, rowKeys, getRowKey]);

  const handleItemDrop = useEvent((targetKey: Key, draggedKeys: Key[]) => {
    if (!dropOnRow) return;

    const target = rowByKeyForDrop.get(String(targetKey));

    if (!target) return;

    const topmostDraggedKeys = treeModel
      ? getTopmostKeys(draggedKeys, treeModel.parentOf)
      : draggedKeys;

    if (
      treeModel &&
      topmostDraggedKeys.some((key) =>
        isTableTreeDescendant(treeModel, targetKey, key),
      )
    ) {
      return;
    }

    const dragged = topmostDraggedKeys
      .map((key) => rowByKeyForDrop.get(String(key)))
      // A row cannot be dropped on itself.
      .filter((row): row is T => row !== undefined && row !== target);

    if (!dragged.length) return;
    if (dropOnRow.isAllowed && !dropOnRow.isAllowed(dragged, target)) return;

    void dropOnRow.onDrop(dragged, target);
  });

  const renderDragPreview = useEvent((keys: Key[]) => (
    <ItemTableDragPreview<T>
      rows={keys
        .map((key) => rowByKeyForDrop.get(String(key)))
        .filter((row): row is T => row !== undefined)}
      getItemDragInfo={getItemDragInfo!}
    />
  ));

  const shouldAcceptItemDrop = useEvent((targetKey: Key) => {
    const target = rowByKeyForDrop.get(String(targetKey));

    return target != null && (dropOnRow?.isTarget(target) ?? false);
  });

  const canReorder = !treeModel && isReorderable;

  return {
    // Dropping onto a row and reordering both need the drag machinery.
    isEnabled: canReorder || dropOnRow != null,
    orderedKeys,
    onReorder: canReorder ? handleReorder : undefined,
    onItemDrop: dropOnRow ? handleItemDrop : undefined,
    shouldAcceptItemDrop: dropOnRow ? shouldAcceptItemDrop : undefined,
    renderPreview: getItemDragInfo ? renderDragPreview : undefined,
  };
}
