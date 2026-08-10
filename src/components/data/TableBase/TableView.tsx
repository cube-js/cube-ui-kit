import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VisuallyHidden } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { MoreIcon, UpIcon } from '../../../icons';
import { Action } from '../../actions/Action/Action';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { useContextMenu } from '../../actions/use-context-menu';
import { Placeholder } from '../../content/Placeholder/Placeholder';
import { Skeleton } from '../../content/Skeleton/Skeleton';
import { TextItem } from '../../content/TextItem';
import { Checkbox } from '../../fields/Checkbox';
import { useToast } from '../../overlays/Toast';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';

import { ColumnResizer } from './ColumnResizer';
import {
  isMenuEmpty,
  normalizeMenuAction,
  ROW_MENU_COLUMN_KEY,
} from './row-menu';
import { TableElement, TableHeaderItem } from './styled';
import { TableRow, TableRowDropIndicator } from './TableRow';
import { selectionRowKey } from './types';
import { toTsv } from './use-cell-selection';
import { useRowMoveAnimation } from './use-row-move-animation';
import { useScrollability } from './use-scrollability';
import { getColumnText, getColumnValue } from './use-table-columns';
import {
  ROW_NUMBER_COLUMN_KEY,
  SELECTION_COLUMN_KEY,
} from './use-table-selection';

import type { Key } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';
import type { NavigateArg } from '../../../providers/navigation.types';
import type {
  CubeResolvedColumn,
  CubeTableCellContext,
  CubeTableColumnLayout,
  CubeTableHeaderContext,
  CubeTableLoadingIndicator,
  CubeTableRowContext,
  CubeTableRowSection,
  CubeTableSort,
} from './types';
import type { useCellSelection } from './use-cell-selection';
import type { CubeTableSelectionState } from './use-table-selection';

/** Visual/behavioural overrides a table adapter may attach to a single row. */
export interface CubeTableRowRenderProps {
  isDimmed?: boolean;
  mods?: Record<string, boolean | undefined>;
  styles?: Styles;
  height?: number;
  qa?: string;
  tooltip?: string;
}

export interface TableViewProps<T = any> {
  qa?: string;
  rows: readonly T[];
  getRowKey: (row: T, index: number) => Key;
  layout: CubeTableColumnLayout<T>;
  /**
   * Receives the scroll container once it exists. A callback rather than a ref
   * because the virtualized path does not create the element itself — Virtuoso
   * does, and hands it over after mount.
   */
  onScrollerRef: (element: HTMLDivElement | null) => void;
  /** Attached to the table's root frame. */
  rootRef?: RefObject<HTMLDivElement | null>;

  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
  shape?: 'plain' | 'card';
  rowHeight?: number;
  headerHeight?: number;
  isHeaderHidden?: boolean;
  isStriped?: boolean;
  /**
   * Vertical rules between columns.
   *
   * A list reads across a row and wants nothing in the way; a grid is read down
   * a column, and the rule is what tells you which column a figure is in when
   * the header has scrolled far to the left. So `ItemTable` leaves it off and
   * `DataTable` turns it on — the same split ag-grid's `columnBorder` gives the
   * Cloud grids today.
   */
  hasColumnDividers?: boolean;
  /**
   * Slide rows to their new positions when the order changes, instead of
   * teleporting them.
   *
   * On by default, and only ever on a pure reorder — see
   * `use-row-move-animation`. Suppressed under `prefers-reduced-motion`.
   */
  isRowMoveAnimated?: boolean;
  /** @default true */
  isHeaderSticky?: boolean;
  /** @default 'auto' — on above `virtualizeThreshold` rows, needs a bounded height. */
  isVirtualized?: boolean | 'auto';
  /** @default 50 */
  virtualizeThreshold?: number;
  /** Rows rendered beyond each edge of the viewport. @default 20 */
  overscan?: number;

  /* status */
  isLoading?: boolean;
  loadingIndicator?: CubeTableLoadingIndicator;
  skeletonRowCount?: number;
  selection?: CubeTableSelectionState<T>;
  selectionTooltip?: string | ((row: T) => string | undefined);
  /** Rendered in the root frame, over the body. For the floating bulk bar. */
  overlay?: ReactNode;
  /** Already normalised by the adapter into a per-row resolver. */
  rowMenu?: (row: T, ctx: CubeTableRowContext<T>) => ReactNode | null;
  rowContextMenu?: boolean | 'context-only';
  onRowMenuAction?: (action: string, row: T, key: Key) => void;
  rowMenuTriggerProps?: Record<string, any>;
  rowLink?: (row: T, index: number) => NavigateArg | undefined;
  onRowAction?: (row: T, key: Key) => void;
  /** Infinite scroll: fires once the end of the list comes into view. */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /**
   * How far before the end to start fetching, in px.
   *
   * Defaults to one viewport height, so the next batch is requested a whole
   * screen before the user could reach the bottom. A fixed 200px — about five
   * rows — meant a fast scroll arrived at the end before the request did, which
   * is the stall this is meant to avoid.
   */
  loadMoreMargin?: number;
  /**
   * Rows pinned above and below the scrolling ones — totals, subtotals.
   *
   * Rendered inside `<tbody>` rather than `<thead>`/`<tfoot>` so they keep the
   * body's own row and cell styling; the sub-element chains are anchored to
   * `Body`. Stickiness comes from the row itself.
   */
  pinnedTopRows?: readonly T[];
  pinnedBottomRows?: readonly T[];
  /**
   * Rectangular cell selection, from `use-cell-selection`.
   *
   * `DataTable` only. A list is acted on by row; a result grid is read by cell,
   * and the block of figures is the thing the user wants out of it.
   */
  cellSelection?: ReturnType<typeof useCellSelection<T>> | null;
  /** 1-based number of the first row, so paging keeps the count continuous. */
  rowNumberOffset?: number;
  /**
   * Rows of the full result that precede this page, and the size of that full
   * result.
   *
   * ARIA row indices are document-absolute by contract: `aria-rowindex` is a
   * row's position in the WHOLE grid and `aria-rowcount` the whole grid's size,
   * so a paged grid has to say "row 21 of 240" rather than restarting at 1 and
   * claiming a count of 25. Without them a screen reader hears colliding
   * indices against a larger count, which is worse than saying nothing.
   *
   * Defaults keep an unpaged table correct: no offset, and a count taken from
   * the rows actually given.
   */
  rowIndexOffset?: number;
  totalRowCount?: number;
  isReorderable?: boolean;
  /** Provided by `DraggableCollection` when reordering is on. */
  dragState?: any;
  dropState?: any;
  /**
   * Drop handling from `useDroppableCollection`. Must land on the element that
   * directly contains the rows — the `<tbody>` — or drops are never received.
   */
  collectionProps?: Record<string, any>;
  bodyRef?: RefObject<HTMLTableSectionElement | null>;
  isResizable?: boolean;
  onColumnResize?: (columnKey: string, width: number) => void;
  onColumnResizeEnd?: (columnKey: string) => void;
  emptyLabel?: ReactNode;
  noResultsLabel?: ReactNode;
  error?: ReactNode;
  /** Selects `noResultsLabel` over `emptyLabel` when there is nothing to show. */
  isFiltered?: boolean;

  /* sorting */
  /** @default 'off' */
  sortMode?: 'client' | 'server' | 'off';
  sort?: CubeTableSort | null;
  /**
   * Multi-column sort. Takes precedence over `sort` when given, and the array
   * order is the precedence — `DataTable` uses it, `ItemTable` uses `sort`.
   */
  sorts?: CubeTableSort[];
  onColumnSort?: (columnKey: string) => void;

  /* per-row hooks */
  getRowProps?: (
    ctx: CubeTableRowContext<T>,
  ) => CubeTableRowRenderProps | undefined;

  /**
   * Typography preset for the column header. A per-adapter default rather than
   * a table-wide constant: `ItemTable` uses the uppercase caption look (`c2`),
   * while an analytics grid wants its headers to read at body size.
   * `headerCellStyles` still wins over it.
   */
  headerPreset?: string;
  /**
   * Typography for the body. `ItemTable` reads as a list at `t3`; a result grid
   * packs more in and wants `t4`.
   */
  contentPreset?: string;

  /** Chrome rendered above the table, in the frame's first grid row. */
  toolbar?: ReactNode;
  /** Chrome rendered below the table, in the frame's last grid row. */
  footer?: ReactNode;

  ariaLabel?: string;
  styles?: Styles;
  headerStyles?: Styles;
  headerCellStyles?: Styles;
  bodyStyles?: Styles;
  rowStyles?: Styles;
  cellStyles?: Styles;
  mods?: Record<string, boolean | undefined>;
}

/**
 * The same block as an HTML table, so a spreadsheet keeps the cell boundaries.
 *
 * Pasting `text/plain` TSV works, but Excel and Sheets then re-guess the types
 * of every field; the HTML flavour is what makes a value that looks like a date
 * stay the text it was on screen.
 */
function toClipboardHtml(matrix: string[][]) {
  const rows = matrix
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('');

  return `<table>${rows}</table>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

export interface TableViewProps<T = any> {
  qa?: string;
  rows: readonly T[];
  getRowKey: (row: T, index: number) => Key;
  layout: CubeTableColumnLayout<T>;
  /**
   * Receives the scroll container once it exists. A callback rather than a ref
   * because the virtualized path does not create the element itself — Virtuoso
   * does, and hands it over after mount.
   */
  onScrollerRef: (element: HTMLDivElement | null) => void;
  /** Attached to the table's root frame. */
  rootRef?: RefObject<HTMLDivElement | null>;

  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
  shape?: 'plain' | 'card';
  rowHeight?: number;
  headerHeight?: number;
  isHeaderHidden?: boolean;
  isStriped?: boolean;
  /** @default true */
  isHeaderSticky?: boolean;
  /** @default 'auto' — on above `virtualizeThreshold` rows, needs a bounded height. */
  isVirtualized?: boolean | 'auto';
  /** @default 50 */
  virtualizeThreshold?: number;
  /** Rows rendered beyond each edge of the viewport. @default 20 */
  overscan?: number;

  /* status */
  isLoading?: boolean;
  loadingIndicator?: CubeTableLoadingIndicator;
  skeletonRowCount?: number;
  emptyLabel?: ReactNode;
  noResultsLabel?: ReactNode;
  error?: ReactNode;
  /** Selects `noResultsLabel` over `emptyLabel` when there is nothing to show. */
  isFiltered?: boolean;

  /* sorting */
  /** @default 'off' */
  sortMode?: 'client' | 'server' | 'off';
  sort?: CubeTableSort | null;
  /**
   * Multi-column sort. Takes precedence over `sort` when given, and the array
   * order is the precedence — `DataTable` uses it, `ItemTable` uses `sort`.
   */
  sorts?: CubeTableSort[];
  onColumnSort?: (columnKey: string) => void;

  /* per-row hooks */
  getRowProps?: (
    ctx: CubeTableRowContext<T>,
  ) => CubeTableRowRenderProps | undefined;

  /**
   * Typography preset for the column header. A per-adapter default rather than
   * a table-wide constant: `ItemTable` uses the uppercase caption look (`c2`),
   * while an analytics grid wants its headers to read at body size.
   * `headerCellStyles` still wins over it.
   */
  headerPreset?: string;
  /**
   * Typography for the body. `ItemTable` reads as a list at `t3`; a result grid
   * packs more in and wants `t4`.
   */
  contentPreset?: string;

  /** Chrome rendered above the table, in the frame's first grid row. */
  toolbar?: ReactNode;
  /** Chrome rendered below the table, in the frame's last grid row. */
  footer?: ReactNode;

  ariaLabel?: string;
  styles?: Styles;
  headerStyles?: Styles;
  headerCellStyles?: Styles;
  bodyStyles?: Styles;
  rowStyles?: Styles;
  cellStyles?: Styles;
  mods?: Record<string, boolean | undefined>;
}

/**
 * Content height per size step, mirroring `$row-height` in `styled.ts`. Only the
 * initial estimate — every rendered row is measured, so a wrong guess costs a
 * scrollbar adjustment, not a layout bug. The `+ 1` is the row separator.
 */
/** Enough to read as "more is coming" without pretending to know how much. */
/**
 * Ceiling on the load-more placeholder burst.
 *
 * These rows are not virtualized — they sit after the window, at the end of the
 * body — so the count is real DOM. 50 rows is already taller than any viewport,
 * which is all the burst has to be.
 */
const MAX_LOAD_MORE_SKELETON_ROWS = 50;

/**
 * Floor on the prefetch distance, for a table too short to measure usefully —
 * an unbounded one reports a viewport of nearly zero before it has any rows.
 */
const MIN_LOAD_MORE_MARGIN = 200;

const ESTIMATED_ROW_HEIGHT = {
  xsmall: 28,
  small: 32,
  medium: 40,
  large: 48,
  xlarge: 56,
} as const;

function pinStyle(column: CubeResolvedColumn): CSSProperties | undefined {
  if (column.pinOffset == null) return undefined;

  return { ['--pin-offset' as any]: `${column.pinOffset}px` };
}

/**
 * The one place table DOM exists. Both `ItemTable` and `DataTable` resolve their
 * props into the shape above and hand it here, so the markup, the ARIA
 * bookkeeping and the tasty sub-element contract have a single implementation.
 */
export function TableView<T = any>(props: TableViewProps<T>) {
  const {
    qa,
    rows,
    getRowKey,
    layout,
    onScrollerRef,
    rootRef,
    size = 'medium',
    shape = 'plain',
    rowHeight,
    headerHeight,
    isHeaderHidden = false,
    isStriped = false,
    hasColumnDividers,
    isRowMoveAnimated = true,
    isHeaderSticky = true,
    isVirtualized = 'auto',
    virtualizeThreshold = 50,
    overscan = 20,
    isLoading = false,
    loadingIndicator = 'overlay',
    skeletonRowCount = 6,
    selection,
    selectionTooltip,
    overlay,
    rowMenu,
    rowContextMenu = false,
    onRowMenuAction,
    rowMenuTriggerProps,
    rowLink,
    onRowAction,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
    loadMoreMargin,
    pinnedTopRows,
    pinnedBottomRows,
    cellSelection,
    rowNumberOffset = 0,
    rowIndexOffset = 0,
    totalRowCount,
    isReorderable = false,
    dragState,
    dropState,
    collectionProps,
    bodyRef,
    isResizable = false,
    onColumnResize,
    onColumnResizeEnd,
    emptyLabel,
    noResultsLabel,
    error,
    isFiltered = false,
    sortMode = 'off',
    sort,
    sorts,
    onColumnSort,
    getRowProps,
    headerPreset,
    contentPreset,
    toolbar,
    footer,
    ariaLabel,
    styles,
    headerStyles,
    headerCellStyles,
    bodyStyles,
    rowStyles,
    cellStyles,
    mods,
  } = props;

  const { columns } = layout;
  const columnCount = columns.length;

  // The element is held here as well as reported upwards: the virtualizer needs
  // it locally, and the adapter needs it to measure column widths.
  const { t } = useI18n();
  const toast = useToast();

  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // `bodyRef` is optional — only the drag-and-drop path supplies one — but the
  // move animation needs the `<tbody>` either way, so it keeps its own and both
  // are filled from one callback.
  const localBodyRef = useRef<HTMLTableSectionElement | null>(null);
  const handleBodyRef = useCallback(
    (element: HTMLTableSectionElement | null) => {
      localBodyRef.current = element;
      if (bodyRef) bodyRef.current = element;
    },
    [bodyRef],
  );
  const handleScrollerRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollerRef.current = element;
      setScrollerEl(element);
      onScrollerRef(element);
    },
    [onScrollerRef],
  );

  // Header rows count towards `aria-rowcount`, which must be document-absolute.
  const headerRowCount = isHeaderHidden ? 0 : 1;

  /* ── the ARIA row index space ───────────────────────────────────────────
   * Four bands, in the order a screen reader walks them:
   *
   *   1                       the header row
   *   2 … 1+top               pinned top rows
   *   …                       the body, offset by the pages before this one
   *   after the whole body    pinned bottom rows
   *
   * Derived once here rather than at each of the four render sites, which is
   * how the body came to be numbered as though the pinned rows above it did
   * not exist while `aria-rowcount` counted them.
   * ─────────────────────────────────────────────────────────────────────── */
  const pinnedTopCount = pinnedTopRows?.length ?? 0;
  const pinnedBottomCount = pinnedBottomRows?.length ?? 0;
  // The whole result, not this page. `rows.length` is the honest fallback when
  // the adapter does not know a total.
  const bodyRowCount = Math.max(
    totalRowCount ?? rows.length,
    rowIndexOffset + rows.length,
  );

  /** 1-based `aria-rowindex` for the i-th body row of the current page. */
  const bodyRowIndex = (rowIndex: number) =>
    headerRowCount + pinnedTopCount + rowIndexOffset + rowIndex + 1;
  /** 1-based `aria-rowindex` for the i-th pinned row at `edge`. */
  const pinnedRowIndex = (index: number, edge: 'top' | 'bottom') =>
    edge === 'top'
      ? headerRowCount + index + 1
      : headerRowCount + pinnedTopCount + bodyRowCount + index + 1;

  const mergedStyles = useMemo(
    () => ({
      ...styles,
      ...(contentPreset ? { Table: { preset: contentPreset } } : null),
      ...(headerStyles ? { HeadRow: headerStyles } : null),
      ...(headerPreset || headerCellStyles
        ? {
            HeaderCell: {
              ...(headerPreset ? { preset: headerPreset } : null),
              ...headerCellStyles,
            },
          }
        : null),
      ...(bodyStyles ? { Body: bodyStyles } : null),
      ...(rowStyles ? { Row: rowStyles } : null),
      ...(cellStyles ? { Cell: cellStyles } : null),
      ...(rowHeight != null ? { '$row-height': `${rowHeight}px` } : null),
      ...(headerHeight != null
        ? { '$header-height': `${headerHeight}px` }
        : null),
    }),
    [
      styles,
      headerStyles,
      headerCellStyles,
      headerPreset,
      contentPreset,
      bodyStyles,
      rowStyles,
      cellStyles,
      rowHeight,
      headerHeight,
    ],
  );

  /**
   * Whether a cell is inside the current range.
   *
   * Pinned rows take part: they sit in the range's row order at the position
   * they occupy on screen, so a selection down a column of figures reaches its
   * total instead of leaving it to be copied separately. (ag-grid excludes
   * pinned rows outright; this is a deliberate departure.)
   */
  function isCellSelected(rowKey: Key, columnKey: string) {
    if (!cellSelection?.isEnabled) return false;

    return cellSelection.isSelected(rowKey, columnKey);
  }

  /**
   * Press and drag for the range.
   *
   * `pointerdown` rather than `click`: the range has to start before the drag
   * does, and a click only lands after the button comes back up — by which time
   * the gesture is over. `pointerenter` grows it while the button is held, which
   * is the same shape ag-grid's `onCellMouseOver` gives the Cloud grids.
   */
  function cellSelectionProps(
    rowKey: Key,
    columnKey: string,
    pinnedEdge?: 'top' | 'bottom',
  ) {
    // A vetoed cell gets no handlers at all, so it is inert rather than merely
    // unpainted: pressing it neither starts a range nor disturbs the standing
    // one, which is how ag-grid treats a press on its row-number column.
    if (!cellSelection?.canSelectCell(rowKey, columnKey)) return undefined;

    return {
      onPointerDown: (event: ReactPointerEvent<HTMLTableCellElement>) => {
        // Right-click keeps whatever is selected, so a context menu can act on
        // the range the user has already built.
        if (event.button !== 0) return;

        if (event.shiftKey) {
          // Otherwise the browser paints a text selection from the anchor to
          // here, on top of the cell range.
          event.preventDefault();
          cellSelection.extendTo(rowKey, columnKey);
        } else {
          cellSelection.select(rowKey, columnKey);
        }

        // The range's keyboard affordances — Escape to clear, ⌘/Ctrl+C to copy
        // — are handled on the scroller, and a `<td>` takes no focus of its
        // own, so a press would otherwise leave focus on `<body>` and neither
        // would ever fire.
        scrollerRef.current?.focus({ preventScroll: true });

        cellSelection.isDraggingRef.current = true;
        setIsRangeDragging(true);
      },
      onPointerEnter: () => {
        if (!cellSelection.isDraggingRef.current) return;

        // Reachable by press and by shift-click, but never by dragging THROUGH.
        // A pinned row sits over the scrolling ones, so a downward drag brushes
        // it long before reaching the end of the data — and being last in the
        // row order, that would snap the range to the whole rest of the grid.
        if (pinnedEdge) return;

        cellSelection.extendTo(rowKey, columnKey);
      },
    };
  }

  /**
   * Marks the trailing column.
   *
   * Two things hang off it. Its resize handle tucks fully inside rather than
   * straddling a boundary that is not there — left hanging it puts half its
   * width past the table, and the scroller gains a few pixels of horizontal
   * scroll onto blank space. And it draws no vertical rule: that rule would
   * land flush against the frame and read as a doubled edge.
   */
  /** The pinned edge a row was rendered at, as the documented section name. */
  function sectionOf(pinnedEdge?: 'top' | 'bottom'): CubeTableRowSection {
    if (pinnedEdge === 'top') return 'pinnedTop';
    if (pinnedEdge === 'bottom') return 'pinnedBottom';

    return 'body';
  }

  function lastColumnFlag(column: CubeResolvedColumn<T>) {
    return column.index === columns.length - 1 ? '' : undefined;
  }

  /**
   * Which frame corner, if any, this cell sits in.
   *
   * Only the two bottom ones, and only when the card's rounded edge is what the
   * row actually meets — a footer below it means the row ends against a straight
   * line instead. Without this a selected cell in that row has its ring sliced
   * off at 45° by the frame's radius, which reads as a rendering fault rather
   * than as a corner.
   *
   * Decided here rather than in CSS: the renderer already knows about the
   * footer, the shape and the pinned rows, and expressing
   * `card × no-footer × visually-last-row × outer-column` as a state map is how
   * a border map turns into a combinatorial one.
   */
  function bottomCornerFlag(
    column: CubeResolvedColumn<T>,
    rowIndex: number,
    isLastRow: boolean,
    pinnedEdge?: 'top' | 'bottom',
  ) {
    if (shape !== 'card' || footer != null) return undefined;

    const pinnedBottomCount = pinnedBottomRows?.length ?? 0;
    const isVisualLastRow =
      pinnedEdge === 'bottom'
        ? rowIndex === pinnedBottomCount - 1
        : pinnedEdge == null && isLastRow && pinnedBottomCount === 0;

    if (!isVisualLastRow) return undefined;
    if (column.index === 0) return 'start';
    if (column.index === columns.length - 1) return 'end';

    return undefined;
  }

  function renderStateRow(content: ReactNode) {
    return (
      <tr data-element="Row" role="row" aria-rowindex={headerRowCount + 1}>
        <td
          data-element="StateCell"
          data-state=""
          role="gridcell"
          colSpan={Math.max(columnCount, 1)}
          aria-colindex={1}
        >
          <div data-element="StateContent">{content}</div>
        </td>
      </tr>
    );
  }

  function renderSkeletonRows(
    count = skeletonRowCount,
    keyPrefix = 'skeleton',
  ) {
    return Array.from({ length: count }, (_, rowIndex) => (
      <tr
        key={`${keyPrefix}-${rowIndex}`}
        data-element="Row"
        data-placeholder=""
        role="row"
        aria-rowindex={bodyRowIndex(rowIndex)}
        aria-busy="true"
      >
        {columns.map((column) => (
          <td
            key={column.key}
            data-element="Cell"
            data-pin={column.pin}
            data-pin-edge={column.isPinEdge ? '' : undefined}
            data-align={column.align}
            role="gridcell"
            aria-colindex={column.ariaColIndex}
            style={pinStyle(column)}
          >
            <Placeholder size="2x" />
          </td>
        ))}
      </tr>
    ));
  }

  function renderSelectionHeaderCell(column: CubeResolvedColumn<T>) {
    return (
      <th
        key={column.key}
        data-element="HeaderCell"
        data-key={column.key}
        data-kind="selection"
        data-pin={column.pin}
        data-pin-edge={column.isPinEdge ? '' : undefined}
        data-last-column={lastColumnFlag(column)}
        role="columnheader"
        scope="col"
        tabIndex={-1}
        aria-colindex={column.ariaColIndex}
        style={pinStyle(column)}
      >
        {selection && selection.selectionMode === 'multiple' ? (
          <div data-element="SelectionBox">
            <Checkbox
              aria-label={
                selection.selectAllState === 'all'
                  ? t('itemTable.deselectAll', 'Deselect all')
                  : t('itemTable.selectAll', 'Select all')
              }
              isSelected={selection.selectAllState === 'all'}
              isIndeterminate={selection.selectAllState === 'some'}
              onChange={selection.toggleSelectAll}
            />
          </div>
        ) : null}
      </th>
    );
  }

  function renderSelectionCell(
    column: CubeResolvedColumn<T>,
    row: T,
    rowIndex: number,
    rowKey: Key,
    isLastRow: boolean,
    pinnedEdge?: 'top' | 'bottom',
  ) {
    const canSelect = selection!.canSelect(rowKey);
    const tooltip =
      typeof selectionTooltip === 'function'
        ? selectionTooltip(row)
        : selectionTooltip;

    const checkbox = (
      <Checkbox
        aria-label={t('itemTable.selectRow', 'Select row')}
        isSelected={selection!.isSelected(rowKey)}
        isDisabled={!canSelect}
        onChange={() => selection!.toggleRow(rowKey)}
      />
    );

    return (
      <td
        key={column.key}
        data-element="Cell"
        data-key={column.key}
        data-kind="selection"
        data-pin={column.pin}
        data-pin-edge={column.isPinEdge ? '' : undefined}
        data-last-row={isLastRow ? '' : undefined}
        data-pinned={pinnedEdge}
        data-last-column={lastColumnFlag(column)}
        data-corner={bottomCornerFlag(column, rowIndex, isLastRow, pinnedEdge)}
        role="gridcell"
        aria-colindex={column.ariaColIndex}
        style={pinStyle(column)}
        // `Checkbox` reports only the next value, so the modifier that decides
        // toggle-vs-extend is read off the event that produced it.
        //
        // `click` rather than `pointerdown`: capture on the cell still runs
        // before the checkbox's own `change` handler, and unlike pointer events
        // it carries the modifier state in every environment — including
        // keyboard activation and jsdom.
        onClickCapture={selection!.captureShift}
        onKeyDownCapture={selection!.captureShift}
      >
        <div data-element="SelectionBox">
          {!canSelect && tooltip ? (
            <TooltipProvider title={tooltip}>{checkbox}</TooltipProvider>
          ) : (
            checkbox
          )}
        </div>
      </td>
    );
  }

  function renderRowMenuCell(
    column: CubeResolvedColumn<T>,
    row: T,
    rowIndex: number,
    rowKey: Key,
    isLastRow: boolean,
    pinnedEdge?: 'top' | 'bottom',
  ) {
    const items = resolveRowMenu(row, rowIndex, rowKey);

    return (
      <td
        key={column.key}
        data-element="Cell"
        data-key={column.key}
        data-kind="actions"
        data-pin={column.pin}
        data-pin-edge={column.isPinEdge ? '' : undefined}
        data-last-row={isLastRow ? '' : undefined}
        data-pinned={pinnedEdge}
        data-last-column={lastColumnFlag(column)}
        data-corner={bottomCornerFlag(column, rowIndex, isLastRow, pinnedEdge)}
        role="gridcell"
        aria-colindex={column.ariaColIndex}
        style={pinStyle(column)}
      >
        {isMenuEmpty(items) ? null : (
          <div data-element="RowActions">
            <MenuTrigger>
              <ItemAction
                // The grid is one tab stop; in-cell controls are reached with
                // arrow keys, matching `TreeNode`.
                tabIndex={-1}
                icon={<MoreIcon />}
                aria-label={t('itemTable.rowActions', 'Row actions')}
                {...rowMenuTriggerProps}
              />
              <Menu onAction={menuActionHandler(row, rowKey, false)}>
                {items}
              </Menu>
            </MenuTrigger>
          </div>
        )}
      </td>
    );
  }

  function renderHeaderCell(column: CubeResolvedColumn<T>) {
    if (column.key === SELECTION_COLUMN_KEY) {
      return renderSelectionHeaderCell(column);
    }

    if (column.key === ROW_NUMBER_COLUMN_KEY) {
      // Deliberately unnamed: the numbers are a reading aid, not data, and a
      // column header would invite sorting by them.
      return (
        <th
          key={column.key}
          data-element="HeaderCell"
          data-key={column.key}
          data-kind="row-number"
          data-last-column={lastColumnFlag(column)}
          role="columnheader"
          scope="col"
          tabIndex={-1}
          aria-colindex={column.ariaColIndex}
          style={pinStyle(column)}
        />
      );
    }

    if (column.key === ROW_MENU_COLUMN_KEY) {
      // An empty header keeps the column in the ARIA geometry without
      // announcing a name for a column that holds no data.
      return (
        <th
          key={column.key}
          data-element="HeaderCell"
          data-key={column.key}
          data-kind="actions"
          data-pin={column.pin}
          data-pin-edge={column.isPinEdge ? '' : undefined}
          data-last-column={lastColumnFlag(column)}
          role="columnheader"
          scope="col"
          tabIndex={-1}
          aria-colindex={column.ariaColIndex}
          style={pinStyle(column)}
        />
      );
    }

    const header = column.header;
    // One resolution path for both shapes, so every consumer of `isSorted`
    // below stays unaware of which one the caller supplied.
    const activeSorts = sorts ?? (sort ? [sort] : []);
    const sortIndex = activeSorts.findIndex(
      (entry) => entry.columnKey === column.key,
    );
    const activeSort = sortIndex === -1 ? null : activeSorts[sortIndex];
    const isSorted = activeSort != null;
    // Only worth showing when more than one column is sorted — a lone "1"
    // beside an arrow is noise.
    const sortRank = activeSorts.length > 1 ? sortIndex + 1 : null;
    const isSortable =
      sortMode !== 'off' && !column.isStructural && column.isSortable === true;

    // A structural column has no content to make room for, and resizing needs
    // somewhere to write the result.
    const canResize =
      !column.isStructural &&
      (column.isResizable ?? isResizable) &&
      onColumnResize != null &&
      onColumnResizeEnd != null;

    const ctx: CubeTableHeaderContext = {
      columnKey: column.key,
      columnIndex: column.index,
      sort: activeSort?.direction ?? null,
      isSortable,
      isResizing: false,
      width: column.width,
    };

    // The arrow keeps its slot even when unsorted, so turning a sort on and off
    // never shifts the label.
    const sortIndicator = isSortable ? (
      <div
        data-element="SortIndicator"
        data-rank={sortRank ?? undefined}
        data-sorted={isSorted ? '' : undefined}
        data-dir={activeSort?.direction}
        aria-hidden="true"
      >
        <UpIcon />
      </div>
    ) : null;

    // The arrow belongs in the `rightIcon` slot: that slot is sized and aligned
    // for an icon, while `suffix` is a text slot and puts the glyph on the
    // label's baseline.
    //
    // A `header.rightIcon` the consumer asked for keeps the slot, and the arrow
    // falls back to `suffix` — rare, and better than dropping either one.
    const hasCustomRightIcon = header?.rightIcon != null;
    const rightIcon = hasCustomRightIcon ? header!.rightIcon : sortIndicator;

    const suffixContent = hasCustomRightIcon ? sortIndicator : null;
    const suffix =
      header?.suffix != null || suffixContent ? (
        <>
          {header?.suffix}
          {suffixContent}
        </>
      ) : undefined;

    const content = header?.render ? (
      header.render(ctx)
    ) : column.title == null && !header ? null : (
      <TableHeaderItem
        icon={header?.icon}
        rightIcon={rightIcon}
        prefix={header?.prefix}
        suffix={suffix}
        description={header?.description}
        descriptionPlacement={header?.descriptionPlacement}
        tooltip={header?.tooltip ?? true}
        theme={header?.theme}
        actions={header?.actions}
        autoHideActions={header?.autoHideActions ?? true}
        styles={header?.styles}
      >
        {column.title}
      </TableHeaderItem>
    );

    return (
      <th
        key={column.key}
        data-element="HeaderCell"
        data-key={column.key}
        data-pin={column.pin}
        data-pin-edge={column.isPinEdge ? '' : undefined}
        data-align={header?.align ?? column.align}
        data-sortable={isSortable ? '' : undefined}
        data-resizable={canResize ? '' : undefined}
        data-last-column={lastColumnFlag(column)}
        data-sorted={isSorted ? '' : undefined}
        role="columnheader"
        scope="col"
        // A sortable header is a control, so it takes a tab stop. Row/cell
        // keyboard navigation lands in a follow-up and will move this to the
        // grid's roving-tabindex model.
        tabIndex={isSortable ? 0 : -1}
        aria-colindex={column.ariaColIndex}
        aria-sort={activeSort ? ARIA_SORT[activeSort.direction] : undefined}
        style={pinStyle(column)}
        onClick={isSortable ? () => onColumnSort?.(column.key) : undefined}
        onKeyDown={
          isSortable
            ? (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                // Space would scroll the grid otherwise.
                event.preventDefault();
                onColumnSort?.(column.key);
              }
            : undefined
        }
      >
        {content}
        {canResize ? (
          <ColumnResizer<T>
            column={column}
            label={t('itemTable.resizeColumn', 'Resize column')}
            onResize={onColumnResize!}
            onResizeEnd={onColumnResizeEnd!}
          />
        ) : null}
      </th>
    );
  }

  function renderCell(
    column: CubeResolvedColumn<T>,
    row: T,
    rowIndex: number,
    rowKey: Key,
    isLastRow: boolean,
    // The row's pinned edge, mirrored onto its cells. Cells are what draw the
    // borders and the fill, and a sub-element cannot ask about its DOM parent's
    // mods — state keys inside `Cell` resolve against the table root.
    pinnedEdge?: 'top' | 'bottom',
  ) {
    // Section-qualified, because the same record is routinely pinned at both
    // edges. `rowKey` below stays the consumer's own — this identity is the
    // range's alone.
    const rangeKey = selectionRowKey(sectionOf(pinnedEdge), rowKey);
    if (column.key === SELECTION_COLUMN_KEY) {
      return renderSelectionCell(
        column,
        row,
        rowIndex,
        rowKey,
        isLastRow,
        pinnedEdge,
      );
    }

    if (column.key === ROW_NUMBER_COLUMN_KEY) {
      return (
        <td
          key={column.key}
          data-element="Cell"
          data-key={column.key}
          data-kind="row-number"
          data-last-row={isLastRow ? '' : undefined}
          data-pinned={pinnedEdge}
          data-last-column={lastColumnFlag(column)}
          data-corner={bottomCornerFlag(
            column,
            rowIndex,
            isLastRow,
            pinnedEdge,
          )}
          role="gridcell"
          aria-colindex={column.ariaColIndex}
          style={pinStyle(column)}
        >
          {/*
            A pinned row is not numbered. It sits outside the sequence — a
            total is not row 1 — and numbering it would repeat a number the
            scrolling rows already own.
          */}
          {pinnedEdge ? null : rowNumberOffset + rowIndex + 1}
        </td>
      );
    }

    if (column.key === ROW_MENU_COLUMN_KEY) {
      return renderRowMenuCell(
        column,
        row,
        rowIndex,
        rowKey,
        isLastRow,
        pinnedEdge,
      );
    }

    const ctx: CubeTableCellContext<T> = {
      row,
      rowKey,
      rowIndex,
      columnKey: column.key,
      columnIndex: column.index,
      section: sectionOf(pinnedEdge),
      // The ROW's selection, matching the field's siblings (`isRowFocused`).
      // Cell-range membership is a different question and has its own answer in
      // `data-cell-selected`.
      isSelected: selection?.isSelected(rowKey) ?? false,
    };

    const value = column.isStructural
      ? undefined
      : getColumnValue(column, row, rowIndex);

    // Without `render`, the cell shows the column's display text — which is
    // what `format` produces, and what client sort, search and copy all agree
    // on. `getColumnText` returns null for a value it cannot turn into text
    // (an object with no `format`), so we render nothing rather than
    // "[object Object]".
    const rendered = column.render
      ? column.render(value, row, rowIndex, ctx)
      : column.isStructural
        ? null
        : getColumnText(column, row, rowIndex);

    const isText =
      typeof rendered === 'string' ||
      typeof rendered === 'number' ||
      typeof rendered === 'bigint';

    // Bare text gets ellipsis + an automatic tooltip when it overflows.
    // `TextItem` rather than `Item` deliberately: `Item` runs `useHotkeys` on
    // every instance, which at one per cell would be hundreds of subscriptions
    // churned on every scroll tick.
    //
    // An `autoHeight` column skips it — `TextItem` exists to truncate, and this
    // column has opted into wrapping instead.
    const content =
      isText && !column.autoHeight ? (
        <TextItem>{String(rendered)}</TextItem>
      ) : isText ? (
        String(rendered)
      ) : (
        (rendered as ReactNode)
      );

    const resolvedCellStyles =
      typeof column.cellStyles === 'function'
        ? column.cellStyles(ctx)
        : column.cellStyles;

    const CellTag = column.isRowHeader ? 'th' : 'td';

    // The link lives in the row-header cell but stretches over the whole row:
    // a `<tr>` cannot be wrapped in an `<a>`, and this is the one cell whose
    // text is the row's accessible name. ⌘-click, middle-click and "Open in
    // new tab" then work natively, which an onClick handler can never give.
    const link = column.isRowHeader ? rowLink?.(row, rowIndex) : undefined;

    return (
      <CellTag
        key={column.key}
        data-element="Cell"
        data-key={column.key}
        data-pin={column.pin}
        data-pin-edge={column.isPinEdge ? '' : undefined}
        data-align={column.align}
        data-wrap={column.autoHeight ? '' : undefined}
        data-link={link !== undefined ? '' : undefined}
        data-last-row={isLastRow ? '' : undefined}
        data-pinned={pinnedEdge}
        data-last-column={lastColumnFlag(column)}
        data-corner={bottomCornerFlag(column, rowIndex, isLastRow, pinnedEdge)}
        data-cell-selected={
          isCellSelected(rangeKey, column.key) ? '' : undefined
        }
        {...(column.isRowHeader
          ? { scope: 'row' as const }
          : { role: 'gridcell' as const })}
        {...cellSelectionProps(rangeKey, column.key, pinnedEdge)}
        aria-colindex={column.ariaColIndex}
        style={{
          ...pinStyle(column),
          ...(resolvedCellStyles as CSSProperties),
        }}
        {...column.cellProps?.(ctx)}
      >
        {content}
        {link !== undefined ? (
          <Action
            data-element="RowLink"
            to={link}
            // The row is the tab stop; the link is reached through it.
            tabIndex={-1}
            aria-label={getColumnText(column, row, rowIndex) ?? undefined}
          />
        ) : null}
      </CellTag>
    );
  }

  /**
   * A pinned row — a total or subtotal.
   *
   * Rendered inside `<tbody>` rather than `<thead>`/`<tfoot>` so it keeps the
   * body's own row and cell styling: the sub-element chains are anchored to
   * `Body`, and a row in the head would match none of them. `data-pinned`
   * carries the stickiness instead.
   */
  function renderPinnedRow(row: T, index: number, edge: 'top' | 'bottom') {
    // The consumer's own key, not a positional one: a cell range spans pinned
    // and scrolling rows alike, so both have to answer to the same identity.
    const rowKey = getRowKey(row, index);

    return (
      <tr
        key={`pinned-${edge}-${rowKey}`}
        data-element="Row"
        data-pinned={edge}
        role="row"
        aria-rowindex={pinnedRowIndex(index, edge)}
      >
        {columns.map((column) =>
          renderCell(column, row, index, rowKey, false, edge),
        )}
      </tr>
    );
  }

  /** The cells of one body row. Shared by both render paths. */
  function renderRowCells(row: T, rowIndex: number) {
    const rowKey = getRowKey(row, rowIndex);

    return columns.map((column) =>
      renderCell(column, row, rowIndex, rowKey, rowIndex === rows.length - 1),
    );
  }

  /**
   * The `<tr>` shell. Virtuoso owns the element in the virtualized path (it
   * needs its own `style` and measurement attributes), so this returns the
   * props rather than the element.
   */
  function getRowElementProps(row: T, rowIndex: number) {
    const rowKey = getRowKey(row, rowIndex);
    const isSelected = selection?.isSelected(rowKey) ?? false;
    const ctx: CubeTableRowContext<T> = {
      row,
      rowKey,
      rowIndex,
      section: 'body',
      isSelected,
    };
    const extra = getRowProps?.(ctx);

    return {
      'data-element': 'Row',
      'data-key': String(rowKey),
      // Lets a pointer or keyboard event resolve back to its row without a
      // closure per row.
      'data-row-index': rowIndex,
      'data-qa': extra?.qa,
      'data-odd': isStriped && rowIndex % 2 === 1 ? '' : undefined,
      'data-dimmed': extra?.isDimmed ? '' : undefined,
      'data-selected': isSelected ? '' : undefined,
      'data-disabled': selection?.isRowDisabled(rowKey) ? '' : undefined,
      role: 'row',
      // Only the resting row takes a tab stop; the rest are reached with the
      // arrow keys. Off entirely when nothing on the row is operable.
      tabIndex: isReorderable
        ? rowIndex === focusedRowIndex
          ? 0
          : -1
        : undefined,
      // Only meaningful in a selectable grid; announcing "not selected" on
      // every row of a plain table is noise.
      'aria-selected': selection?.isEnabled ? isSelected : undefined,
      'aria-rowindex': bodyRowIndex(rowIndex),
      title: extra?.tooltip,
      height: extra?.height,
      'data-clickable':
        onRowAction != null || rowLink?.(row, rowIndex) !== undefined
          ? ''
          : undefined,
      onClick:
        onRowAction != null
          ? (event: ReactMouseEvent) => {
              // A click that landed on a control inside the cell belongs to
              // that control — the row must not also act on it.
              if (
                (event.target as HTMLElement).closest(
                  'a, button, input, select, textarea, [role="button"], [role="menuitem"]',
                )
              ) {
                return;
              }

              onRowAction(row, rowKey);
            }
          : undefined,
      onContextMenu: isMenuEnabled
        ? (event: ReactMouseEvent) =>
            openContextMenuFor(row, rowIndex, rowKey, event)
        : undefined,
      ...Object.fromEntries(
        Object.entries(extra?.mods ?? {})
          .filter(([, active]) => active)
          .map(([name]) => [`data-${name}`, '']),
      ),
    } as Record<string, any>;
  }

  function renderRow(row: T, rowIndex: number, isVirtual = false) {
    const { height, ...rowProps } = getRowElementProps(row, rowIndex);
    const rowKey = getRowKey(row, rowIndex);

    return (
      <TableRow
        key={rowProps['data-key']}
        rowKey={rowKey}
        rowProps={rowProps}
        height={height}
        index={isVirtual ? rowIndex : undefined}
        measureRef={isVirtual ? virtualizer.measureElement : undefined}
        dragState={isReorderable ? dragState : undefined}
        dropState={isReorderable ? dropState : undefined}
      >
        {renderRowCells(row, rowIndex)}
      </TableRow>
    );
  }

  function renderSpacerRow(height: number, position: 'top' | 'bottom') {
    if (height <= 0) return null;

    return (
      <tr aria-hidden="true" data-spacer={position}>
        <td colSpan={Math.max(columnCount, 1)} style={{ height }} />
      </tr>
    );
  }

  /**
   * A row, preceded by the line showing a drop above it — and followed by one
   * for the very last row, which has nothing after it to carry a "before".
   *
   * The indicators render nothing unless a drag is in flight, so a table that
   * is merely *capable* of dragging keeps its ordinary structure.
   */
  function withDropIndicators(row: T, index: number, isVirtual = false) {
    const rowKey = getRowKey(row, index);
    const rowNode = renderRow(row, index, isVirtual);

    if (!isReorderable || !dropState) return rowNode;

    return (
      <Fragment key={`row-${String(rowKey)}`}>
        <TableRowDropIndicator
          rowKey={rowKey}
          dropPosition="before"
          dropState={dropState}
          columnCount={columnCount}
        />
        {rowNode}
        {index === rows.length - 1 ? (
          <TableRowDropIndicator
            rowKey={rowKey}
            dropPosition="after"
            dropState={dropState}
            columnCount={columnCount}
          />
        ) : null}
      </Fragment>
    );
  }

  const hasRows = rows.length > 0;

  // How a refresh over an existing result is presented. `overlay` keeps the
  // previous rows on screen (dimmed, behind a spinner) so a server page or a
  // re-sort does not blank the table; `skeleton` discards them; `none` leaves
  // the visuals entirely to the consumer and only sets `aria-busy`.
  // `overlay` is the only behaviour that paints: the rows dim and a spinner
  // sits over them. `none` deliberately leaves them untouched.
  const isStale = isLoading && hasRows && loadingIndicator === 'overlay';
  const showSkeleton =
    isLoading &&
    loadingIndicator !== 'none' &&
    (!hasRows || loadingIndicator === 'skeleton');
  // Without rows and without an indicator there is nothing to say yet —
  // rendering the empty state would flash "No items" before the first response.
  const showBlank = isLoading && !hasRows && loadingIndicator === 'none';

  const shouldVirtualize =
    hasRows &&
    error == null &&
    (isVirtualized === true ||
      (isVirtualized === 'auto' && rows.length > virtualizeThreshold));

  const rowsRef = useRef(rows);

  rowsRef.current = rows;

  // `getScrollElement` is read from a ref, not the state value: the virtualizer
  // consults it from a layout effect, and a closure over state can still hold
  // the `null` from the first render.
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    getScrollElement: () => scrollerRef.current,
    getItemKey: (index) => String(getRowKey(rowsRef.current[index], index)),
    estimateSize: () =>
      (rowHeight ?? ESTIMATED_ROW_HEIGHT[size ?? 'medium']) + 1,
    measureElement: (element) => element.getBoundingClientRect().height,
    // Rows beyond each viewport edge. Higher than a list's, because a fast
    // flick outruns React's re-render and the gap shows as blank rows — and a
    // table row is one element, not one per column, so the extra ones are
    // cheap.
    overscan,
  });

  // `scrollerEl` is referenced only to re-render on the pass where the scroller
  // first exists, so the virtualizer re-reads `getScrollElement` and attaches.
  void scrollerEl;

  const scrollability = useScrollability(scrollerEl);

  /**
   * Roving tabindex over the rows, so a reorderable table can be operated from
   * the keyboard at all.
   *
   * React Aria's `dragProps` already describe "press Enter to start dragging"
   * and implement the whole keyboard drag — but a `<tr>` is not focusable, so
   * without this the description is announced for a row nobody can reach. One
   * tab stop for the grid, arrows to move within it, matching how every other
   * collection in the kit behaves.
   */
  // Not while a drag is in flight: React Aria is already moving the row under
  // the pointer, and a second transform fighting it reads as a stutter.
  useRowMoveAnimation({
    isEnabled: isRowMoveAnimated && !dragState?.draggingKeys?.size,
    bodyRef: localBodyRef,
  });

  /**
   * How many rows the next batch is likely to bring, measured across the last
   * fetch that actually happened.
   *
   * The placeholder burst is sized to this so the scroll height is right both
   * before and after the load: a short burst under a long batch makes the
   * content jump the moment the rows land, and leaves the user stopped at the
   * bottom of the list in the meantime with nothing left to scroll into.
   *
   * Measured across `isLoadingMore`, not from any growth in `rows`. Plenty of
   * things lengthen the list without being a fetch — clearing a client search
   * over an infinite list restores every filtered-out row at once — and reading
   * that as a batch of ninety sized the next burst at ninety.
   *
   * Measured at all, rather than taken from `pageSize`, because infinite-scroll
   * consumers often do not set it.
   */
  const lastBatchSizeRef = useRef(0);
  const rowCountBeforeFetchRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoadingMore) {
      rowCountBeforeFetchRef.current = rows.length;

      return;
    }

    const before = rowCountBeforeFetchRef.current;

    if (before != null && rows.length > before) {
      lastBatchSizeRef.current = rows.length - before;
    }

    rowCountBeforeFetchRef.current = null;
    // Deliberately keyed on the flag alone: the row count wanted is the one at
    // each edge of the fetch, not every value it passes through.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore]);

  const loadMoreSkeletonCount = Math.min(
    // Until a fetch has been measured, the rows already loaded are the best
    // guess at what the next batch brings — that IS the first page.
    Math.max(lastBatchSizeRef.current || rows.length || skeletonRowCount, 1),
    MAX_LOAD_MORE_SKELETON_ROWS,
  );

  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  // Only used to suppress text selection during the gesture; the range itself
  // lives in a ref so growing it does not re-render on every cell crossed.
  const [isRangeDragging, setIsRangeDragging] = useState(false);

  // The button can come up outside the grid — over the footer, over another
  // component, off the window entirely — so the end of the gesture is watched
  // globally rather than on the cell the drag started in.
  useEffect(() => {
    if (!isRangeDragging) return;

    const end = () => {
      if (cellSelection) cellSelection.isDraggingRef.current = false;
      setIsRangeDragging(false);
    };

    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [isRangeDragging, cellSelection]);

  const moveRowFocus = useEvent((from: HTMLElement, delta: number) => {
    const current = from.closest('tr[data-element="Row"]');
    const all = Array.from(
      scrollerRef.current?.querySelectorAll<HTMLTableRowElement>(
        'tbody tr[data-element="Row"]:not([data-placeholder])',
      ) ?? [],
    );

    if (!all.length) return false;

    const index = current ? all.indexOf(current as HTMLTableRowElement) : -1;
    const next = Math.min(
      Math.max((index === -1 ? focusedRowIndex : index) + delta, 0),
      all.length - 1,
    );

    setFocusedRowIndex(next);
    all[next]?.focus();

    return true;
  });

  /* ── infinite scroll ────────────────────────────────────────────────────
   * An `IntersectionObserver` on a sentinel row rather than a scroll handler:
   * `rootMargin` expresses "prefetch this far before the end" directly, it
   * costs nothing per scroll tick, and it works on both render paths — under
   * virtualization the trailing spacer holds the remaining height, so the
   * sentinel after it still marks the true end of the list.
   * ──────────────────────────────────────────────────────────────────────── */
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreEvent = useEvent(() => onLoadMore?.());

  useEffect(() => {
    const sentinel = sentinelRef.current;

    // Re-armed whenever `isLoadingMore` flips, so a request in flight cannot be
    // fired again by the sentinel still sitting in view.
    if (!onLoadMore || !hasMore || isLoadingMore || !scrollerEl || !sentinel) {
      return;
    }

    // One screen ahead by default: the request goes out while the user still
    // has a viewport of rows left to read, so the batch is usually there before
    // they arrive. Read at arm time rather than tracked — a resize mid-scroll
    // leaves the margin slightly stale, which costs nothing.
    const margin =
      loadMoreMargin ?? Math.max(scrollerEl.clientHeight, MIN_LOAD_MORE_MARGIN);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreEvent();
      },
      { root: scrollerEl, rootMargin: `0px 0px ${margin}px 0px` },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    onLoadMore,
    hasMore,
    isLoadingMore,
    scrollerEl,
    loadMoreMargin,
    onLoadMoreEvent,
    rows.length,
  ]);

  /* ── row menu ───────────────────────────────────────────────────────────
   * One instance for the whole table rather than one per row: a table can hold
   * thousands of rows, and only ever one context menu is open.
   *
   * `targetRef` is deliberately left unattached, which keeps the hook's own
   * `contextmenu` listener unbound — it would open with fixed props, and the
   * items depend on which row was right-clicked. The handler below resolves the
   * row first and then opens with that row's items; with no target, the hook
   * positions from the event's viewport coordinates, which is what a
   * pointer-anchored menu wants anyway.
   * ──────────────────────────────────────────────────────────────────────── */
  const contextMenu = useContextMenu<HTMLDivElement, any>(Menu, {
    placement: 'bottom start',
  });

  const isMenuEnabled = rowMenu != null && rowContextMenu !== false;
  const hasMenuColumn = isMenuEnabled && rowContextMenu !== 'context-only';

  function resolveRowMenu(row: T, rowIndex: number, rowKey: Key) {
    if (!rowMenu) return null;

    return rowMenu(row, {
      row,
      rowKey,
      rowIndex,
      section: 'body',
      isSelected: selection?.isSelected(rowKey) ?? false,
      isFocused: false,
      isDropTarget: false,
    });
  }

  function menuActionHandler(row: T, rowKey: Key, closeAfter: boolean) {
    return (action: Key) => {
      onRowMenuAction?.(normalizeMenuAction(action), row, rowKey);

      // `useContextMenu` leaves its popover open after an action — the same
      // happens in `Tree`, so it is the hook's behaviour rather than this
      // table's. Closing here keeps the row menu correct meanwhile; drop this
      // once the hook closes on select itself.
      if (closeAfter) contextMenu.close();
    };
  }

  const openContextMenuFor = useEvent(
    (
      row: T,
      rowIndex: number,
      rowKey: Key,
      event: ReactMouseEvent | ReactKeyboardEvent,
    ) => {
      const items = resolveRowMenu(row, rowIndex, rowKey);

      // No items means no menu — falling through to the browser's own context
      // menu is more useful than opening an empty popover.
      if (isMenuEmpty(items)) return;

      event.preventDefault();
      contextMenu.open(
        { children: items, onAction: menuActionHandler(row, rowKey, true) },
        undefined,
        // Shift+F10 carries no coordinates; the hook then anchors on the
        // element that produced the event, which is the row.
        'clientX' in event.nativeEvent
          ? (event.nativeEvent as MouseEvent)
          : undefined,
      );
    },
  );

  /** Resolves the row a pointer or keyboard event landed in. */
  function rowFromEvent(target: EventTarget | null) {
    const element = (target as HTMLElement | null)?.closest?.(
      'tr[data-element="Row"][data-key]',
    );

    if (!element) return null;

    const index = Number(element.getAttribute('data-row-index'));

    if (!Number.isInteger(index)) return null;

    const row = rows[index];

    return row === undefined ? null : { row, index };
  }

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  const colGroup = (
    <colgroup>
      {columns.map((column) => (
        <col
          key={column.key}
          style={column.width != null ? { width: column.width } : undefined}
        />
      ))}
    </colgroup>
  );

  const headerRow = isHeaderHidden ? null : (
    <tr data-element="HeadRow" role="row" aria-rowindex={1}>
      {columns.map(renderHeaderCell)}
    </tr>
  );

  const tableProps = {
    'data-element': 'Table',
    role: 'grid',
    'aria-label': ariaLabel,
    'aria-busy': isLoading || undefined,
    'aria-rowcount':
      headerRowCount + pinnedTopCount + bodyRowCount + pinnedBottomCount,
    'aria-colcount': columnCount,
    'aria-multiselectable':
      selection?.selectionMode === 'multiple' ? true : undefined,
  } as const;

  let bodyContent: ReactNode;

  if (error != null) {
    bodyContent = renderStateRow(error);
  } else if (showSkeleton) {
    bodyContent = renderSkeletonRows();
  } else if (showBlank) {
    bodyContent = null;
  } else if (!hasRows) {
    bodyContent = renderStateRow(isFiltered ? noResultsLabel : emptyLabel);
  } else if (shouldVirtualize) {
    bodyContent = (
      <>
        {renderSpacerRow(paddingTop, 'top')}
        {virtualItems.map((v) =>
          withDropIndicators(rows[v.index], v.index, true),
        )}
        {renderSpacerRow(paddingBottom, 'bottom')}
      </>
    );
  } else {
    bodyContent = rows.map((row, index) => withDropIndicators(row, index));
  }

  // Before the first measure there are no columns to lay out yet — show the
  // generic table skeleton rather than an empty frame.
  //
  // Returned HERE, below every hook, not at the point in the render where the
  // condition is known. Returning early skipped sixteen hooks — the virtualizer,
  // the scrollability observer, the move animation, the context menu, two
  // `useState`s — so the first render with columns called more hooks than the
  // last one without them, and React threw "Rendered more hooks than during the
  // previous render". A consumer that mounts with `columns={[]}` while loading
  // and fills them in from a response is the ordinary case, not an exotic one.
  if (columnCount === 0 && isLoading) {
    return (
      <TableElement
        ref={rootRef}
        qa={qa || 'Table'}
        styles={mergedStyles}
        mods={{ size, shape, ...mods }}
      >
        {toolbar}
        <div data-element="Scroller" ref={handleScrollerRef}>
          <Skeleton layout="table" />
        </div>
      </TableElement>
    );
  }

  return (
    <TableElement
      ref={rootRef}
      qa={qa || 'Table'}
      styles={mergedStyles}
      mods={{
        size,
        shape,
        'sticky-header': isHeaderSticky,
        'column-dividers': hasColumnDividers,
        'range-dragging': isRangeDragging,
        // The footer's top border is the closing edge, so the last row must not
        // draw one as well.
        'has-footer': footer != null,
        'scroll-x': scrollability.x,
        'scroll-y': scrollability.y,
        stale: isStale,
        ...mods,
      }}
    >
      {toolbar}
      <div
        data-element="Scroller"
        ref={handleScrollerRef}
        // Focusable only programmatically: a cell press moves focus here so the
        // range's shortcuts land, but the grid stays a single tab stop.
        tabIndex={cellSelection?.isEnabled ? -1 : undefined}
        // Escape is the standard way out of a selection, and it must work from
        // wherever focus happens to be inside the table.
        onKeyDown={(event) => {
          // Shift+F10 is the standard way to reach a context menu from the
          // keyboard, and the only way when there is no `⋮` trigger.
          if (event.key === 'F10' && event.shiftKey && isMenuEnabled) {
            const found = rowFromEvent(event.target);

            if (found) {
              event.stopPropagation();
              openContextMenuFor(
                found.row,
                found.index,
                getRowKey(found.row, found.index),
                event,
              );
            }

            return;
          }

          if (event.key === 'Enter' && onRowAction) {
            const found = rowFromEvent(event.target);

            // Enter on a control inside the cell belongs to that control.
            if (
              found &&
              !(event.target as HTMLElement).closest(
                'a, button, input, select, textarea, [role="button"]',
              )
            ) {
              onRowAction(found.row, getRowKey(found.row, found.index));
            }

            return;
          }

          if (
            isReorderable &&
            (event.key === 'ArrowDown' || event.key === 'ArrowUp')
          ) {
            // Not while a drag is in flight — the arrows then belong to React
            // Aria, which uses them to choose the drop position.
            if (dragState?.draggingKeys?.size) return;

            if (
              moveRowFocus(
                event.target as HTMLElement,
                event.key === 'ArrowDown' ? 1 : -1,
              )
            ) {
              event.preventDefault();
            }

            return;
          }

          if (event.key === 'Escape') {
            if (cellSelection?.range) {
              event.stopPropagation();
              cellSelection.clear();

              return;
            }

            if (selection?.isEnabled && selection.selectedCount > 0) {
              event.stopPropagation();
              selection.clearSelection();
            }
          }
        }}
        // `onCopy` rather than a ⌘/Ctrl+C keydown: it is the event the browser
        // already fires for the shortcut AND for Edit ▸ Copy, and writing
        // through `clipboardData` needs no permission prompt. Both `text/plain`
        // and `text/html` go on, so Excel and Sheets paste a grid rather than
        // one run of text.
        onCopy={(event) => {
          if (!cellSelection?.range) return;

          const matrix = cellSelection.getSelectionMatrix(
            (column, row, rowIndex) =>
              column.isStructural
                ? ''
                : getColumnText(column, row, rowIndex) ?? '',
          );

          if (!matrix.length) return;

          // Both formats from the same matrix. Building the HTML by re-parsing
          // the TSV tore any cell whose value contained a tab or a newline —
          // exactly the values the TSV had to quote in the first place.
          event.preventDefault();
          event.clipboardData.setData('text/plain', toTsv(matrix));
          event.clipboardData.setData('text/html', toClipboardHtml(matrix));

          // A copy that writes to the clipboard leaves nothing on screen to say
          // it worked — the range looks the same before and after. The count is
          // what confirms the right block went, which matters most when the
          // selection runs past the bottom of the viewport.
          toast.success({
            title: t('itemTable.copiedToClipboard', 'Copied to clipboard'),
            description: t('itemTable.copiedCells', '{{count}} cells copied', {
              count: cellSelection.cellCount,
            }),
          });
        }}
      >
        <table
          {...tableProps}
          style={
            layout.totalWidth != null ? { width: layout.totalWidth } : undefined
          }
        >
          {colGroup}
          {isHeaderHidden ? null : (
            <thead data-element="Head">{headerRow}</thead>
          )}
          <tbody data-element="Body" {...collectionProps} ref={handleBodyRef}>
            {pinnedTopRows?.map((row, index) =>
              renderPinnedRow(row, index, 'top'),
            )}
            {bodyContent}
            {pinnedBottomRows?.map((row, index) =>
              renderPinnedRow(row, index, 'bottom'),
            )}
            {/*
              Skeleton rows rather than a spinner: they keep the row grid, say
              "more rows of this shape are coming", and grow the scroll height
              smoothly instead of a block that appears and vanishes. It also
              matches what the first load already shows.

              Sized to the batch that is coming (see `loadMoreSkeletonCount`),
              not to a fixed few: the point is that the list keeps its length
              through the load, so the user can carry on scrolling into it and
              nothing lurches when the rows arrive.
            */}
            {isLoadingMore
              ? renderSkeletonRows(loadMoreSkeletonCount, 'load-more')
              : null}
            {onLoadMore && hasRows ? (
              <tr data-sentinel="" aria-hidden="true">
                <td
                  colSpan={Math.max(columnCount, 1)}
                  style={{ height: 1, padding: 0, border: 0 }}
                >
                  {/*
                    A plain block with real height, not the `<tr>` or `<td>`
                    itself: an `IntersectionObserver` given a zero-area table
                    part produced no entries at all — not even the initial one
                    every observer is supposed to emit on `observe`.
                  */}
                  <div ref={sentinelRef} style={{ height: 1 }} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {/*
        A refresh is shown by sweeping the table itself, not by parking a
        spinner over it — the rows stay readable, which is the whole point of
        keeping the previous result on screen. This is what announces it.

        Always mounted, with the TEXT appearing and disappearing: a live region
        announces changes to its CONTENT, so an empty node that merely carries
        an `aria-label` says nothing, and one that is inserted already-populated
        is unreliable across screen readers. The region has to be there first
        and then fill.
      */}
      <VisuallyHidden>
        <span role="status">
          {isStale ? t('itemTable.refreshing', 'Refreshing') : ''}
        </span>
      </VisuallyHidden>
      {overlay}
      {contextMenu.rendered}
      {footer}
    </TableElement>
  );
}
