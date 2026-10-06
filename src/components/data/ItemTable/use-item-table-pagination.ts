import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import {
  clampPage,
  getPageInfo,
} from '../../navigation/Pagination/use-pagination';
import { reindexTableTree } from '../TableBase/table-tree';

import type { TableTreeNode } from '../TableBase/table-tree';
import type { useTableStorage } from '../TableBase/use-table-storage';
import type { ItemTableFooterProps } from './ItemTableFooter';
import type { CubeItemTableProps } from './types';

export interface UseItemTablePaginationOptions<T>
  extends Pick<
    CubeItemTableProps<T>,
    | 'pageSize'
    | 'onPageSizeChange'
    | 'pageSizeOptions'
    | 'page'
    | 'defaultPage'
    | 'onPageChange'
    | 'total'
    | 'totalPages'
    | 'hasNextPage'
    | 'summary'
  > {
  mode: NonNullable<CubeItemTableProps<T>['paginationMode']>;
  defaultPageSize: number;
  /** See `autoHidePagination`. */
  autoHide: boolean;
  /** The searched, sorted flat rows. */
  rows: readonly T[];
  /** The searched, sorted tree roots; empty outside tree mode. */
  treeRoots: TableTreeNode<T>[];
  isTree: boolean;
  storage: ReturnType<typeof useTableStorage>;
}

/**
 * The table's pagination: page and page size, the latter persisted when the
 * table owns it, the current page's rows (flat) or roots (tree), and the props
 * of the footer's page control while it has anything to do.
 */
export function useItemTablePagination<T>({
  mode,
  rows,
  treeRoots,
  isTree,
  pageSize: pageSizeProp,
  defaultPageSize,
  onPageSizeChange,
  pageSizeOptions,
  page: pageProp,
  defaultPage,
  onPageChange,
  total: totalProp,
  totalPages,
  hasNextPage,
  summary,
  autoHide,
  storage,
}: UseItemTablePaginationOptions<T>) {
  // Deliberately not `usePagination`: that hook owns an in-memory array, and in
  // server mode `data` is a single page. Deriving the bounds from it would clamp
  // the page to 1 and swallow every page change.
  const [pageSize, setPageSizeState] = useControlledState<number>(
    pageSizeProp as number,
    pageSizeProp === undefined && storage.has('pageSize')
      ? storage.initial.pageSize ?? defaultPageSize
      : defaultPageSize,
    onPageSizeChange as (value: number) => void,
  );
  const [page, setPageState] = useControlledState<number>(
    pageProp as number,
    defaultPage ?? 1,
    onPageChange as (value: number) => void,
  );

  const isInfinite = mode === 'infinite';
  // Infinite scroll replaces the page control rather than adding to it.
  const isPaginated = mode !== 'off' && !isInfinite;
  const isServerPaginated = mode === 'server';
  const total = isServerPaginated
    ? totalProp ?? 0
    : isTree
      ? treeRoots.length
      : rows.length;

  const pageInfo = getPageInfo({
    page,
    pageSize,
    total,
    totalPages: isServerPaginated ? totalPages : undefined,
  });

  const setPage = useEvent((next: number) =>
    setPageState(clampPage(next, pageInfo.totalPages)),
  );
  const setPageSize = useEvent((next: number) => {
    setPageSizeState(next);

    if (pageSizeProp === undefined) storage.write({ pageSize: next });

    // The old page index points at different rows under a new page size, so
    // staying on it would silently move the user.
    setPageState(1);
  });

  const pageRows =
    mode === 'client'
      ? rows.slice((pageInfo.page - 1) * pageSize, pageInfo.page * pageSize)
      : rows;

  const pageTreeRoots = useMemo(
    () =>
      reindexTableTree(
        mode === 'client'
          ? treeRoots.slice(
              (pageInfo.page - 1) * pageSize,
              pageInfo.page * pageSize,
            )
          : treeRoots,
      ),
    [treeRoots, mode, pageInfo.page, pageSize],
  );

  /**
   * Pagination that cannot do anything is noise: one page of five rows still
   * renders "1–5 of 5", a page-size selector whose every option shows the same
   * five rows, and a solitary "1" button.
   *
   * "Cannot do anything" is both conditions together — a single page *and* a
   * total that even the smallest page size would not split. A 15-row single
   * page stays, because choosing "10 / page" would genuinely paginate it.
   */
  const smallestPageSize = pageSizeOptions?.length
    ? Math.min(...pageSizeOptions)
    : pageSize;

  const isPaginationUseless =
    autoHide &&
    !hasNextPage &&
    pageInfo.totalPages <= 1 &&
    total <= smallestPageSize;

  const showPagination = isPaginated && !isPaginationUseless;

  const control: ItemTableFooterProps['pagination'] = showPagination
    ? {
        page: pageInfo.page,
        pageSize,
        total,
        totalPages: pageInfo.totalPages,
        pageSizeOptions,
        summary,
        hasNextPage,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }
    : undefined;

  return {
    /** Clamped to the page count. */
    page: pageInfo.page,
    pageSize,
    total,
    isInfinite,
    isPaginated,
    /** The current page's flat rows; every row unless paging client-side. */
    pageRows,
    /** The current page's tree roots, re-indexed for the treegrid. */
    pageTreeRoots,
    /** The footer's page control; `undefined` while it is hidden. */
    control,
  };
}
