import type { Key } from '@react-types/shared';
import type { BaseProps, ContainerStyleProps, Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { NavigateArg } from '../../../providers/navigation.types';
import type { SizeName } from '../../../tokens';
import type { CubeItemActionProps } from '../../actions/ItemAction/ItemAction';
import type { CubeTablePageInfo } from '../../navigation/Pagination';
import type { CubeTableRowRenderProps } from '../TableBase/TableView';
import type {
  CubeTableColumn,
  CubeTableLayoutProps,
  CubeTableLoadingIndicator,
  CubeTableRowContext,
  CubeTableSelectAllMode,
  CubeTableSelectionMode,
  CubeTableSort,
  CubeTableTreeProps,
} from '../TableBase/types';
import type { CubeTablePersistKey } from '../TableBase/use-table-storage';

export type CubeItemTableColumn<T = any> = CubeTableColumn<T>;

export interface CubeItemTableProps<T = any>
  extends BaseProps,
    ContainerStyleProps,
    CubeTableLayoutProps,
    CubeTableTreeProps<T> {
  /* ── data ─────────────────────────────────────────────────────────── */
  data: readonly T[];
  columns: CubeItemTableColumn<T>[];
  /** Property used as the row key. @default 'id' */
  rowKey?: string;
  /** Wins over `rowKey`. */
  getRowKey?: (row: T, index: number) => Key;

  /* ── status ───────────────────────────────────────────────────────── */
  isLoading?: boolean;
  /**
   * How a refresh over an existing result is presented.
   * @default 'overlay'
   */
  loadingIndicator?: CubeTableLoadingIndicator;
  /** Skeleton rows shown while loading with no data yet. @default 6 */
  skeletonRowCount?: number;
  /** Nothing to show at all. @default localized "No items" */
  emptyLabel?: ReactNode;
  /**
   * Shown instead of `emptyLabel` when a search or filter is narrowing the
   * data. @default localized "No results found"
   */
  noResultsLabel?: ReactNode;
  /** Takes precedence over both labels. */
  error?: ReactNode;
  /**
   * Selects `noResultsLabel` over `emptyLabel` when there is nothing to show.
   * Set automatically by the built-in search; pass it explicitly when you filter
   * `data` yourself, so an empty result still reads as "no matches" rather than
   * "nothing exists".
   */
  isFiltered?: boolean;

  /* ── shape / sizing ───────────────────────────────────────────────── */
  /** @default 'plain' */
  shape?: 'plain' | 'card';
  /** @default 'medium' */
  size?: SizeName;
  /** Row height in px. Defaults to the height implied by `size`. */
  rowHeight?: number;
  /** Header height in px. Defaults to `rowHeight`. */
  headerHeight?: number;
  /** Alternating row background. @default false */
  /**
   * Slide rows to their new positions when the sort changes, instead of
   * teleporting them. @default true
   */
  isRowMoveAnimated?: boolean;
  isStriped?: boolean;
  /** @default false */
  isHeaderHidden?: boolean;
  /** Keep the column header pinned while the body scrolls. @default true */
  isHeaderSticky?: boolean;
  /** @default 'auto' — on above `virtualizeThreshold` rows; needs a bounded height. */
  isVirtualized?: boolean | 'auto';
  /** @default 50 */
  virtualizeThreshold?: number;
  /**
   * Rows rendered beyond each edge of the viewport while virtualized. Raise it
   * if a fast scroll shows blank rows; lower it to mount fewer at once.
   * @default 20
   */
  overscan?: number;

  /* ── sorting ──────────────────────────────────────────────────────── */
  /**
   * `'client'` reorders `data` using each column's `compare` (or a locale-aware
   * default). `'server'` never reorders — it only reflects `sort` and fires
   * `onSortChange`. `'off'` removes the sort affordance entirely.
   * @default 'client' when any column is sortable, else 'off'
   */
  sortMode?: 'client' | 'server' | 'off';
  sort?: CubeTableSort | null;
  defaultSort?: CubeTableSort | null;
  onSortChange?: (sort: CubeTableSort | null) => void;

  /* ── toolbar ──────────────────────────────────────────────────────── */
  /**
   * Replaces the entire toolbar row. Compose it from `ItemTable.Search` and
   * friends, which read the table's state from context.
   */
  toolbar?: ReactNode;
  /** Render the built-in search input in the toolbar. @default false */
  isSearchable?: boolean;
  /**
   * `'client'` filters `data` with the built-in matcher. `'server'` never
   * filters — it only reports the term through `onSearchChange`.
   * @default 'client'
   */
  searchMode?: 'client' | 'server';
  searchPlaceholder?: string;
  /**
   * Controlled term. Works with `isSearchable={false}` too, so a page can render
   * its own input anywhere and still drive the table's matcher.
   */
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Debounces the filter and the callback in BOTH modes. @default 500 */
  searchDelay?: number;
  /**
   * Replaces the default client matcher, which tests each searchable column's
   * display text (`format?.(value) ?? String(getValue(row))`).
   */
  searchFilter?: (row: T, query: string) => boolean;
  /** Left group, after the search input. */
  filters?: ReactNode;
  /** Right group. Arbitrary JSX — Buttons, ButtonGroups, anything. */
  actions?: ReactNode;
  onRefresh?: () => void;

  /* ── pagination / footer ──────────────────────────────────────────── */
  /**
   * `'client'` slices `data` itself. `'server'` never slices — it reflects
   * `page` and reports changes. `'off'` renders no pagination.
   * @default 'client'
   */
  paginationMode?: 'client' | 'server' | 'infinite' | 'off';
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  /** @default [10, 20, 50, 100, 500] */
  pageSizeOptions?: number[];
  /** Controlled page, 1-based. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /**
   * `paginationMode="infinite"` replaces the page control with load-on-scroll.
   * The table never slices in that mode — `data` is the accumulated list.
   */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** How far before the end to prefetch, in px. @default 200 */
  loadMoreMargin?: number;

  /** Server mode: total rows across all pages. Preferred over `totalPages`. */
  total?: number;
  totalPages?: number;
  /** Server mode with an unknown total. */
  hasNextPage?: boolean;
  /** Footer summary. `true` → localized "1–50 of 1,204". @default true */
  summary?: boolean | ((info: CubeTablePageInfo) => ReactNode);
  /** Replaces the entire footer row. */
  footer?: ReactNode;
  /**
   * First-class footer slots. These are what a "load all results" button or a
   * row-count label go into — no DOM injection required.
   */
  footerStart?: ReactNode;
  footerCenter?: ReactNode;
  footerEnd?: ReactNode;

  /* ── selection ────────────────────────────────────────────────────── */
  /** @default 'none' */
  selectionMode?: CubeTableSelectionMode;
  /** Controlled selection. `'all'` is a sentinel the consumer interprets. */
  selectedKeys?: Key[] | 'all';
  defaultSelectedKeys?: Key[] | 'all';
  /**
   * `rows` holds only the rows the client has loaded — with the `'all'`
   * sentinel that is necessarily fewer than the selection denotes.
   */
  onSelectionChange?: (keys: Key[] | 'all', rows: T[]) => void;
  /**
   * What the header checkbox acts on.
   * @default 'page'
   */
  selectAllMode?: CubeTableSelectAllMode;
  /** The row stays focusable and clickable; only its checkbox goes inert. */
  isRowSelectable?: (row: T) => boolean;
  /** Explains why a row cannot be selected, on its disabled checkbox. */
  selectionTooltip?: string | ((row: T) => string | undefined);
  /** Rows that cannot be interacted with at all. */
  disabledKeys?: Key[];
  /**
   * Multiple-selection behavior in tree mode. `cascade` selects eligible
   * descendants and derives indeterminate ancestors. @default 'cascade'
   */
  treeSelectionBehavior?: 'cascade' | 'independent';

  /* ── bulk actions ─────────────────────────────────────────────────── */
  /**
   * Actions offered while rows are selected. Supplying any implies
   * `selectionMode="multiple"` — a bulk action with no way to select is a
   * contradiction, not a configuration.
   */
  bulkActions?: CubeTableBulkAction<T>[];
  /**
   * `floating` centres the bar over the body without changing the table's
   * height; `toolbar` replaces the `actions` group while a selection exists.
   * @default 'floating'
   */
  bulkBarPlacement?: 'floating' | 'toolbar';
  bulkBarStyles?: Styles;

  /* ── row interaction ──────────────────────────────────────────────── */
  /**
   * Turns the row-header cell into a stretched link covering the whole row, so
   * ⌘-click, middle-click and "Open in new tab" work natively. Return
   * `undefined` for a row that should not navigate.
   */
  rowLink?: (row: T, index: number) => NavigateArg | undefined;
  /**
   * Non-navigational activation: Enter, or a click when there is no `rowLink`.
   * A click on an interactive cell control never reaches it.
   */
  onRowAction?: (row: T, key: Key) => void;

  /* ── row menu (mirrors Tree) ──────────────────────────────────────── */
  /** `Menu.Item` children. Return `null` to give a row no menu. */
  rowMenu?:
    | ReactNode
    | ((row: T, ctx: CubeTableRowContext<T>) => ReactNode | null);
  /**
   * Where the menu is exposed, matching `Tree#contextMenu`:
   * - `false` — no menu, even when `rowMenu` is set.
   * - `true` — a `⋮` trigger column **and** right-click / Shift+F10.
   * - `'context-only'` — right-click / Shift+F10 only, no trigger column.
   * @default false
   */
  rowContextMenu?: boolean | 'context-only';
  onRowMenuAction?: (action: string, row: T, key: Key) => void;
  rowMenuTriggerProps?: Partial<CubeItemActionProps>;

  /* ── per-row ──────────────────────────────────────────────────────── */
  /**
   * Per-row visuals. Note the deliberate three-way split: `disabledKeys` makes
   * a row non-interactive, `isRowSelectable` leaves it interactive but its
   * checkbox inert, and `isDimmed` here is purely visual.
   */
  getRowProps?: (
    ctx: CubeTableRowContext<T>,
  ) => CubeTableRowRenderProps | undefined;

  /* ── styles ───────────────────────────────────────────────────────── */
  /** The root. Sub-elements reach every internal part of the table. */
  styles?: Styles;
  /** The column header ROW. The top chrome is `toolbarStyles`. */
  headerStyles?: Styles;
  headerCellStyles?: Styles;
  /**
   * Typography preset for the column header. Defaults to `'c3'` — the small
   * uppercase caption the Cloud list tables use. Pass `'t3m'` for body-sized
   * headers, or override anything else through `headerCellStyles`.
   */
  headerPreset?: string;
  toolbarStyles?: Styles;
  searchStyles?: Styles;
  footerStyles?: Styles;

  /* ── drag & drop ──────────────────────────────────────────────────── */
  /** Lets rows be dragged into a new order. */
  isReorderable?: boolean;
  /**
   * The new order, and the rows in it. Called with every row key, not just the
   * moved one, so the consumer can persist the order directly.
   */
  onReorder?: (keys: Key[], rows: T[]) => void;

  /**
   * Dropping rows *onto* a row — a workbook into a folder.
   *
   * Independent of `isReorderable`, and composable with it: `isTarget` decides
   * per row whether a drop lands *on* it, and anything that says no falls
   * through to reordering. Cloud has to treat the two as mutually exclusive
   * because ag-grid cannot express both; that limitation does not carry over.
   *
   * Replaces Cloud's `isDropOnRowEnabled`, `isDropTarget`, `isDropOnRowAllowed`
   * and `onDropOnRow`, plus the two ag-grid workarounds beside them
   * (`dropTargetRowKeyRef`, `dropTargetRefreshColumnKey`) that exist only
   * because ag-grid cannot re-render one cell from React state.
   */
  dropOnRow?: {
    /** Which rows can receive a drop. */
    isTarget: (row: T) => boolean;
    /** Pair-specific guard, e.g. a folder cannot be dropped into itself. */
    isAllowed?: (dragged: T[], target: T) => boolean;
    onDrop: (dragged: T[], target: T) => void | Promise<void>;
  };

  /**
   * What the cursor drags. One row shows its icon and label; several show a
   * count, which is the only honest thing a single chip can say about them.
   *
   * Without it the browser drags a screenshot of the row, and a full-width
   * table row makes a page-wide slab. Replaces Cloud's `getItemDragInfo`, which
   * had to re-inject its icon into ag-grid's ghost element on every drag tick
   * because ag-grid overwrites the ghost whenever the pointer leaves the grid.
   */
  getItemDragInfo?: (row: T) => { label: ReactNode; icon?: ReactNode };

  /* ── column resize ────────────────────────────────────────────────── */
  /** Default for every column; a column overrides with `isResizable`. */
  isResizable?: boolean;
  /** Controlled widths, keyed by column key. */
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  /** Fires once the drag or key press finishes, not on every pixel. */
  onColumnResize?: (
    columnKey: string,
    width: number,
    all: Record<string, number>,
  ) => void;

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

  /* ── persistence ──────────────────────────────────────────────────── */
  /**
   * Persists the table's own state under `cube-ui-kit:table:${storageKey}`.
   * Controlled state is never stored — it belongs to the page.
   */
  storageKey?: string;
  /**
   * Hides the pagination control when it cannot do anything: a single page
   * whose total even the smallest `pageSizeOptions` entry would not split.
   * The footer itself still renders if any slot has content.
   * @default true
   */
  autoHidePagination?: boolean;

  /** @default ['pageSize', 'columnWidths'] */
  persist?: CubeTablePersistKey[];
  bodyStyles?: Styles;
  rowStyles?: Styles;
  cellStyles?: Styles;

  /* ── misc ─────────────────────────────────────────────────────────── */
  ariaLabel?: string;
  qa?: string;
  mods?: Record<string, boolean | undefined>;
}

export interface CubeTableBulkAction<T = any> {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /**
   * `rows` holds the loaded rows for the selection. `setLoading` drives this
   * action's own spinner, so one slow request does not freeze the others.
   */
  onAction: (
    rows: T[],
    ctx: { setLoading: (isLoading: boolean) => void },
  ) => void | Promise<void>;
  isDisabled?: (rows: T[]) => boolean;
  disabledTooltip?: string;
  type?: 'primary' | 'outline' | 'clear';
  theme?: 'default' | 'danger';
  /**
   * Clears the selection once the action resolves. On by default — the rows an
   * action just deleted or moved are usually gone.
   * @default true
   */
  deselectAfter?: boolean;
}
