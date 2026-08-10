import type { Key } from '@react-types/shared';
import type { BaseProps, ContainerStyleProps, Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { SizeName } from '../../../tokens';
import type { CubeTablePageInfo } from '../../navigation/Pagination';
import type {
  CubeTableCellRange,
  CubeTableColumn,
  CubeTableLoadingIndicator,
  CubeTableRowContext,
  CubeTableRowSection,
  CubeTableSort,
} from '../TableBase/types';

/**
 * A `DataTable` column.
 *
 * The same shape `ItemTable` uses. `dataType` is the one addition, and it is
 * deliberately presentational — alignment and numeric formatting — rather than
 * a Cube type: nothing under `src/components/data/` knows what a measure is.
 */
export interface CubeDataTableColumn<T = any> extends CubeTableColumn<T> {
  /**
   * Drives the default alignment and numeric font. `number` right-aligns and
   * switches to tabular figures so digits line up down the column.
   */
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
}

export interface CubeDataTableProps<T = any>
  extends BaseProps,
    ContainerStyleProps {
  /* ── data ─────────────────────────────────────────────────────────── */
  data: readonly T[];
  columns: CubeDataTableColumn<T>[];
  rowKey?: string;
  getRowKey?: (row: T, index: number) => Key;

  /**
   * Totals and subtotals, pinned above and below the scrolling rows. Ordinary
   * rows as far as the columns are concerned — the consumer decides what a
   * total means.
   */
  pinnedTopRows?: readonly T[];
  pinnedBottomRows?: readonly T[];

  /* ── status ───────────────────────────────────────────────────────── */
  isLoading?: boolean;
  /** @default 'overlay' */
  loadingIndicator?: CubeTableLoadingIndicator;
  skeletonRowCount?: number;
  error?: ReactNode;
  emptyLabel?: ReactNode;
  noResultsLabel?: ReactNode;
  isFiltered?: boolean;

  /* ── shape ────────────────────────────────────────────────────────── */
  shape?: 'plain' | 'card';
  /** @default 'small' — an analytical grid packs more rows than a list. */
  size?: SizeName;
  rowHeight?: number;
  headerHeight?: number;
  /** @default true — banding is what makes a wide row readable across. */
  isStriped?: boolean;
  isHeaderHidden?: boolean;
  isHeaderSticky?: boolean;
  /**
   * Slide rows to their new positions when the sort changes, instead of
   * teleporting them. @default true
   */
  isRowMoveAnimated?: boolean;
  /** Numbers each row down the side. @default false */
  showRowNumbers?: boolean;

  /* ── sorting ──────────────────────────────────────────────────────── */
  /** @default 'client' */
  sortMode?: 'client' | 'server' | 'off';
  /**
   * Multi-column, unlike `ItemTable`'s single `sort`: an analytical grid is
   * routinely sorted by one dimension then another, and Cloud's reports send
   * an array of sorts to the query.
   */
  sorts?: CubeTableSort[];
  defaultSorts?: CubeTableSort[];
  onSortsChange?: (sorts: CubeTableSort[]) => void;

  /* ── pagination ───────────────────────────────────────────────────── */
  /** @default 'client' */
  paginationMode?: 'client' | 'server' | 'off';
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  summary?: boolean | ((info: CubeTablePageInfo) => ReactNode);
  /** @default true */
  autoHidePagination?: boolean;
  footerStart?: ReactNode;
  footerCenter?: ReactNode;
  footerEnd?: ReactNode;

  /* ── cell selection ───────────────────────────────────────────────── */
  /**
   * A list is acted on by row; a result grid is read by cell. Click selects a
   * cell, shift-click and drag grow a rectangle, and ⌘/Ctrl+C copies it.
   *
   * `'cell'` allows one cell at a time; `'none'` turns the whole thing off.
   * @default 'range'
   */
  cellSelectionMode?: 'none' | 'cell' | 'range';
  /**
   * Vetoes individual cells. A pinned total's label cell is the motivating case:
   * `"Total"` is a caption for the row, not a figure, and there is nothing
   * useful to do with it selected.
   *
   * ```tsx
   * isCellSelectable={({ section, columnKey }) =>
   *   !(section === 'pinnedBottom' && columnKey === 'region')
   * }
   * ```
   *
   * A vetoed cell is inert — it cannot anchor or receive a range, never
   * highlights, and copies as an empty field so a block spanning it keeps its
   * shape.
   */
  isCellSelectable?: (ctx: {
    row: T;
    rowKey: Key;
    columnKey: string;
    section: CubeTableRowSection;
  }) => boolean;
  selectedCellRange?: CubeTableCellRange | null;
  defaultSelectedCellRange?: CubeTableCellRange | null;
  onCellRangeChange?: (range: CubeTableCellRange | null) => void;

  /* ── columns ──────────────────────────────────────────────────────── */
  /** @default true — a result grid is the case resizing exists for. */
  isResizable?: boolean;
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnResize?: (
    columnKey: string,
    width: number,
    all: Record<string, number>,
  ) => void;

  /* ── virtualization ───────────────────────────────────────────────── */
  isVirtualized?: boolean | 'auto';
  virtualizeThreshold?: number;
  overscan?: number;

  /* ── per-row ──────────────────────────────────────────────────────── */
  getRowProps?: (
    ctx: CubeTableRowContext<T>,
  ) => Record<string, any> | undefined;

  /* ── persistence ──────────────────────────────────────────────────── */
  storageKey?: string;

  /* ── styles ───────────────────────────────────────────────────────── */
  styles?: Styles;
  headerStyles?: Styles;
  headerCellStyles?: Styles;
  bodyStyles?: Styles;
  rowStyles?: Styles;
  cellStyles?: Styles;
  footerStyles?: Styles;

  ariaLabel?: string;
  qa?: string;
  mods?: Record<string, boolean>;
}
