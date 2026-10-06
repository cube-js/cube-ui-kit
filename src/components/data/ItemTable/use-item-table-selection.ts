import { useMemo } from 'react';

import { flattenTableTree } from '../TableBase/table-tree';
import { useTableSelection } from '../TableBase/use-table-selection';

import type { Key } from '@react-types/shared';
import type { TableTreeNode } from '../TableBase/table-tree';
import type { CubeTableSelectionMode } from '../TableBase/types';
import type { UseTableSelectionOptions } from '../TableBase/use-table-selection';
import type { CubeItemTableProps } from './types';

type PaginationMode = NonNullable<CubeItemTableProps['paginationMode']>;

interface SelectionScopeOptions<T> {
  /** The rows on screen. */
  rows: readonly T[];
  /** Every searched, sorted flat row, across pages. */
  sortedRows: readonly T[];
  isTree: boolean;
  /** Every searched, sorted tree root, across pages. */
  sortedTreeRoots: TableTreeNode<T>[];
  /** The current page's tree roots. */
  pageTreeRoots: TableTreeNode<T>[];
  paginationMode: PaginationMode;
}

export interface UseItemTableSelectionOptions<T>
  extends SelectionScopeOptions<T>,
    Pick<
      UseTableSelectionOptions<T>,
      | 'rowKeys'
      | 'getRowKey'
      | 'selectedKeys'
      | 'defaultSelectedKeys'
      | 'onSelectionChange'
      | 'selectAllMode'
      | 'isRowSelectable'
      | 'disabledKeys'
    > {
  /** Inferred from `bulkActions` when absent. */
  selectionMode?: CubeTableSelectionMode;
  bulkActions?: CubeItemTableProps<T>['bulkActions'];
  treeSelectionBehavior: 'cascade' | 'independent';
}

/**
 * The rows the header checkbox can reach beyond the ones on screen: the whole
 * current page, which in tree mode includes collapsed descendants, and the
 * wider set it acts on under `selectAllMode="filtered"`.
 */
function getSelectionScope<T>({
  rows,
  sortedRows,
  isTree,
  sortedTreeRoots,
  pageTreeRoots,
  paginationMode,
}: SelectionScopeOptions<T>): Pick<
  UseTableSelectionOptions<T>,
  'pageRows' | 'pageRowKeys' | 'filteredRows' | 'filteredRowKeys'
> {
  // In server mode the client only ever holds one page, so the filtered set and
  // the page coincide.
  const isClientPaginated = paginationMode === 'client';

  if (!isTree) {
    return {
      pageRows: rows,
      pageRowKeys: undefined,
      filteredRows: isClientPaginated ? sortedRows : rows,
      filteredRowKeys: undefined,
    };
  }

  const pageEntries = flattenTableTree(pageTreeRoots);
  const filteredEntries = isClientPaginated
    ? flattenTableTree(sortedTreeRoots)
    : pageEntries;

  return {
    pageRows: pageEntries.map((entry) => entry.row),
    pageRowKeys: pageEntries.map((entry) => entry.key),
    filteredRows: filteredEntries.map((entry) => entry.row),
    filteredRowKeys: filteredEntries.map((entry) => entry.key),
  };
}

/**
 * `useTableSelection` over the rows the table resolved, flat or tree, with the
 * selection mode implied by bulk actions.
 */
export function useItemTableSelection<T>({
  rows,
  rowKeys,
  sortedRows,
  isTree,
  sortedTreeRoots,
  pageTreeRoots,
  paginationMode,
  getRowKey,
  selectionMode,
  bulkActions,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  selectAllMode,
  isRowSelectable,
  disabledKeys,
  treeSelectionBehavior,
}: UseItemTableSelectionOptions<T>) {
  const selectionTree = useMemo(() => {
    if (!isTree) return undefined;

    // Selection follows the tree the user can currently act on. In
    // particular, a search that retains only an ancestor path must not let a
    // checked ancestor reach siblings that the search removed.
    const childrenOf = new Map<Key, Key[]>();
    const parentOf = new Map<Key, Key | null>();

    flattenTableTree(sortedTreeRoots).forEach((node) => {
      childrenOf.set(
        node.key,
        node.children.map((child) => child.key),
      );
      parentOf.set(node.key, node.parentKey);
    });

    return {
      rootKeys: sortedTreeRoots.map((node) => node.key),
      childrenOf,
      parentOf,
      behavior: treeSelectionBehavior,
    };
  }, [isTree, sortedTreeRoots, treeSelectionBehavior]);

  // A bulk action with no way to select rows is a contradiction, so supplying
  // any implies multiple selection unless the consumer says otherwise.
  const resolvedSelectionMode =
    selectionMode ?? (bulkActions?.length ? 'multiple' : 'none');

  return useTableSelection<T>({
    rows,
    rowKeys,
    ...getSelectionScope({
      rows,
      sortedRows,
      isTree,
      sortedTreeRoots,
      pageTreeRoots,
      paginationMode,
    }),
    getRowKey,
    selectionMode: resolvedSelectionMode,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode,
    isRowSelectable,
    disabledKeys,
    tree: selectionTree,
  });
}
