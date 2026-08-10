import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks';

import type { CubePaginationItem, CubeTablePageInfo } from './types';

function range(start: number, end: number): number[] {
  const length = end - start + 1;

  return length > 0 ? Array.from({ length }, (_, i) => start + i) : [];
}

export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1;

  return Math.min(Math.max(Math.trunc(page), 1), Math.max(totalPages, 1));
}

export interface PaginationRangeOptions {
  page: number;
  totalPages: number;
  /** Page buttons either side of the current page. @default 1 */
  siblingCount?: number;
  /** Page buttons pinned at each end. @default 1 */
  boundaryCount?: number;
}

/**
 * Page numbers to render, with `'gap'` marking an elided run. The output length
 * is bounded by `boundaryCount * 2 + siblingCount * 2 + 3` regardless of
 * `totalPages` — which is the whole point of `type="numbers"`: a 100k-row table
 * at 100 per page renders ~7 buttons, not 1000 `Select` items.
 */
export function getPaginationRange({
  page,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): CubePaginationItem[] {
  if (totalPages <= 0) return [];

  const current = clampPage(page, totalPages);

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages,
  );

  // Pull the sibling window inwards when it would run past either boundary, so
  // the rendered count stays constant as the user pages through.
  const siblingsStart = Math.max(
    Math.min(
      current - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1,
    ),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1,
  );

  return [
    ...startPages,

    // A gap that would hide exactly one page renders that page instead.
    ...(siblingsStart > boundaryCount + 2
      ? (['gap'] as CubePaginationItem[])
      : boundaryCount + 1 < totalPages - boundaryCount
        ? [boundaryCount + 1]
        : []),

    ...range(siblingsStart, siblingsEnd),

    ...(siblingsEnd < totalPages - boundaryCount - 1
      ? (['gap'] as CubePaginationItem[])
      : totalPages - boundaryCount > boundaryCount
        ? [totalPages - boundaryCount]
        : []),

    ...endPages,
  ];
}

export function getPageInfo(options: {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}): CubeTablePageInfo {
  const { pageSize, total } = options;
  const totalPages =
    options.totalPages ??
    (pageSize > 0 ? Math.max(Math.ceil(total / pageSize), 1) : 1);
  const page = clampPage(options.page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);

  return { page, pageSize, totalPages, total, from, to };
}

export interface UsePaginationOptions {
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export type UsePaginationResult<T> = CubeTablePageInfo & {
  /** The current page's slice of `items`. */
  pageItems: T[];
  setPage: (page: number) => void;
  /** Also resets to page 1, since the old page index no longer means anything. */
  setPageSize: (pageSize: number) => void;
};

/**
 * Client-side pagination over an in-memory array. Standalone — `ItemTable` uses
 * it internally, but it works on its own for any paged list.
 */
export function usePagination<T>(
  items: readonly T[],
  options: UsePaginationOptions = {},
): UsePaginationResult<T> {
  const [pageSize, setPageSizeState] = useControlledState<number>(
    options.pageSize as number,
    options.defaultPageSize ?? 50,
    options.onPageSizeChange as (v: number) => void,
  );
  const [page, setPageState] = useControlledState<number>(
    options.page as number,
    options.defaultPage ?? 1,
    options.onPageChange as (v: number) => void,
  );

  const info = getPageInfo({ page, pageSize, total: items.length });

  const setPage = useEvent((next: number) => {
    setPageState(clampPage(next, info.totalPages));
  });

  const setPageSize = useEvent((next: number) => {
    setPageSizeState(next);
    setPageState(1);
  });

  const pageItems = useMemo(
    () => items.slice((info.page - 1) * pageSize, info.page * pageSize) as T[],
    [items, info.page, pageSize],
  );

  return { ...info, pageItems, setPage, setPageSize };
}
