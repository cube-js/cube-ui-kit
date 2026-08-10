import type { BaseProps, OuterStyleProps, Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';

/**
 * How the page control is rendered.
 *
 * - `numbers` — `1 2 3 … 42` buttons. Correct for large page counts because it
 *   never materializes one element per page.
 * - `select` — a `Select` listing every page (or item range). Only viable when
 *   the page count is small.
 * - `compact` — `‹ 3 of 42 ›`, no page buttons at all.
 */
export type CubePaginationType = 'numbers' | 'select' | 'compact';

/** Everything a summary or label renderer needs to describe the current page. */
export interface CubeTablePageInfo {
  /** 1-based. */
  page: number;
  pageSize: number;
  totalPages: number;
  /** Total items across all pages. `0` when unknown. */
  total: number;
  /** 1-based index of the first item on this page. */
  from: number;
  /** 1-based index of the last item on this page. */
  to: number;
}

/**
 * A `'gap'` entry stands for the ellipsis between two runs of page numbers.
 * Exported because `Pagination` and its tests both need to reason about it.
 */
export type CubePaginationItem = number | 'gap';

export interface CubePaginationProps extends BaseProps, OuterStyleProps {
  /** Controlled current page. 1-based. */
  page?: number;
  /** Initial page for uncontrolled usage. @default 1 */
  defaultPage?: number;
  onPageChange?: (page: number) => void;

  /**
   * Total number of pages. Supply this, or `total` + `pageSize` and it is
   * derived. When neither is available the control falls back to prev/next
   * only, driven by `hasNextPage`.
   */
  totalPages?: number;
  /** Total items across all pages. Preferred over `totalPages`. */
  total?: number;

  /** Controlled page size. */
  pageSize?: number;
  /** Initial page size for uncontrolled usage. @default 50 */
  defaultPageSize?: number;
  /** Supplying this together with `onPageSizeChange` renders the size selector. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;

  /** @default 'numbers' */
  type?: CubePaginationType;
  /** Page buttons rendered either side of the current page. @default 1 */
  siblingCount?: number;
  /** Page buttons pinned at each end. @default 1 */
  boundaryCount?: number;

  /** @default 'small' */
  size?: 'xsmall' | 'small' | 'medium';
  isDisabled?: boolean;
  /**
   * Cursor pagination with an unknown total: keeps "next" enabled while there
   * is more to fetch. Ignored when `totalPages` is known.
   */
  hasNextPage?: boolean;
  /** Hide the first/last jump buttons. @default false */
  isCompact?: boolean;

  /** `true` renders the localized "1–50 of 1,204". @default false */
  summary?: boolean | ((info: CubeTablePageInfo) => ReactNode);
  /** Labels the entries of `type="select"`. Defaults to item ranges. */
  labelFormatter?: (info: CubeTablePageInfo) => ReactNode;

  ariaLabel?: string;
  styles?: Styles;
  pageSizeSelectStyles?: Styles;
}
