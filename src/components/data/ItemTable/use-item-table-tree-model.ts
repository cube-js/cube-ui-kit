import { useMemo } from 'react';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { buildTableTree } from '../TableBase/table-tree';

import type { Key } from '@react-types/shared';
import type { CubeTableTreeProps } from '../TableBase/types';
import type { CubeItemTableColumn } from './types';

export interface UseItemTableTreeModelOptions<T>
  extends Pick<CubeTableTreeProps<T>, 'getRowChildren' | 'treeColumnKey'> {
  data: readonly T[];
  columns: CubeItemTableColumn<T>[];
  getRowKey: (row: T, index: number) => Key;
  isReorderable: boolean;
}

/**
 * Tree mode's model: the hierarchy `getRowChildren` describes, the column that
 * carries its indentation, and a warning for each part of the data or props
 * that tree mode ignores. `treeModel` is `null` for flat data.
 */
export function useItemTableTreeModel<T>({
  data,
  columns,
  getRowKey,
  getRowChildren,
  treeColumnKey,
  isReorderable,
}: UseItemTableTreeModelOptions<T>) {
  const treeModel = useMemo(
    () =>
      getRowChildren ? buildTableTree(data, getRowChildren, getRowKey) : null,
    [data, getRowChildren, getRowKey],
  );

  useWarn(treeModel != null && treeModel.duplicateKeys.length > 0, {
    key: ['item-table-tree-duplicate-keys'],
    args: [
      'ItemTable:',
      'Tree row keys must be unique across the complete hierarchy. Duplicate rows were ignored.',
    ],
  });
  useWarn(treeModel != null && treeModel.cyclicKeys.length > 0, {
    key: ['item-table-tree-cyclic-keys'],
    args: [
      'ItemTable:',
      'Tree data contains a cycle. Cyclic descendants were ignored.',
    ],
  });
  useWarn(treeModel != null && isReorderable, {
    key: ['item-table-tree-reorder-unsupported'],
    args: [
      'ItemTable:',
      '`isReorderable` is ignored in tree mode. Use `dropOnRow` for folder-style moves.',
    ],
  });

  const resolvedTreeColumnKey = useMemo(() => {
    if (!treeModel) return undefined;
    const visibleColumns = columns.filter((column) => !column.isHidden);
    return visibleColumns.some((column) => column.key === treeColumnKey)
      ? treeColumnKey
      : visibleColumns[0]?.key;
  }, [treeModel, columns, treeColumnKey]);

  useWarn(
    treeModel != null &&
      treeColumnKey != null &&
      resolvedTreeColumnKey !== treeColumnKey,
    {
      key: ['item-table-tree-column-invalid', treeColumnKey],
      args: [
        'ItemTable:',
        '`treeColumnKey` must identify a visible data column. Falling back to the first visible column.',
      ],
    },
  );

  return { treeModel, treeColumnKey: resolvedTreeColumnKey };
}
