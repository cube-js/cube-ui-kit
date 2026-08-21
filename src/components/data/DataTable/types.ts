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
  CubeTableRowSize,
  CubeTableSort,
  CubeTableTreeProps,
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

/**
 * A header band spanning one or more DataTable columns.
 *
 * Groups are presentational: sorting, resizing, selection and the value
 * pipeline continue to operate on the leaf columns in `children`.
 */
export interface CubeDataTableColumnGroup<T = any> {
  /** Stable identity within the column tree. */
  key: string;
  title?: ReactNode;
  children: CubeDataTableColumnDefinition<T>[];
}

/** A leaf column or a nested header group. */
export type CubeDataTableColumnDefinition<T = any> =
  | CubeDataTableColumn<T>
  | CubeDataTableColumnGroup<T>;

export interface CubeDataTableProps<T = any>
  extends BaseProps,
    ContainerStyleProps,
    CubeTableTreeProps<T> {
  /* ── data ─────────────────────────────────────────────────────────── */
  data: readonly T[];
  columns: CubeDataTableColumnDefinition<T>[];
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
  /**
   * Row height as a named step: `small` 28px, `medium` 32px, `large` 40px.
   *
   * Only the rows — the header keeps whatever `size` gives it, so a denser body
   * does not drag the header down with it. `rowHeight` wins when both are set.
   *
   * Unset, the row height comes from `size` as before, which at this table's
   * default (`size="small"`) is the same 32px `medium` gives. They diverge only
   * if you also move `size`: `size="large"` alone is 48px rows.
   */
  rowSize?: CubeTableRowSize;
  /** An exact height in px, when none of the named steps is the answer. */
  rowHeight?: number;
  /** Exact height of each header row in px. */
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

  /* ── column order ─────────────────────────────────────────────────── */
  /**
   * Drag column headers sideways to reorder them.
   *
   * Named for the axis: `ItemTable`'s `isReorderable` already means ROW
   * reordering, and the two are different features.
   *
   * Structural and pinned columns stay put. `pin` is already the ordering
   * authority for a pinned column, and a sticky `<th>` cannot be hit-tested
   * reliably under horizontal scroll.
   *
   * @default false
   */
  isColumnReorderable?: boolean;
  /**
   * Controlled order, as column keys. Works with or without dragging, so a
   * column manager elsewhere in the page can drive it on its own.
   *
   * Stale keys are ignored, and a column missing from the list lands after the
   * neighbour it had in `columns` rather than at the end.
   */
  columnOrder?: string[];
  defaultColumnOrder?: string[];
  /** The FULL key list, including hidden and pinned columns. */
  onColumnOrderChange?: (order: string[]) => void;

  /* ── column menu ──────────────────────────────────────────────────── */
  /**
   * Where a column's `header.menu` is exposed.
   *
   * - `true` — a `⋮` trigger in the header, plus right-click and Shift+F10.
   * - `'context-only'` — right-click and Shift+F10 only, no trigger.
   * - `false` — suppressed entirely.
   *
   * @default true
   */
  columnContextMenu?: boolean | 'context-only';
  /**
   * The key of the pressed `Menu.Item`, as written — no `.$` prefix.
   *
   * Fires for the reserved sort keys too (`sort-asc`, `sort-desc`,
   * `clear-sort`), after the table has already applied them.
   */
  onColumnMenuAction?: (action: string, columnKey: string) => void;
  columnMenuTriggerProps?: Record<string, any>;
  columnMenuProps?: Record<string, any>;

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
