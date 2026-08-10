import type { Key } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { CubeItemProps } from '../../content/Item';

export type CubeTableSortDirection = 'asc' | 'desc';
export type CubeTableAlign = 'start' | 'center' | 'end';
export type CubeTableRowSection = 'body' | 'pinnedTop' | 'pinnedBottom';

/**
 * `asc | desc` rather than React Aria's `ascending | descending`: we do not use
 * `useTableState`, so there is no `SortDescriptor` interop to preserve, and
 * every consumer and server query parameter already speaks `asc|desc`.
 * `aria-sort` is a one-line map in the header cell.
 */
/**
 * A rectangular block of cells, stored as two opposite corners.
 *
 * Corners rather than a set of keys so the selection survives a re-sort or a
 * page change the way a keyed row selection does: "the block between these two
 * cells" is re-resolved against the current order every render.
 */
export interface CubeTableCellRange {
  fromRowKey: Key;
  toRowKey: Key;
  fromColumnKey: string;
  toColumnKey: string;
}

export interface CubeTableSort {
  /** `key` of the sorted column. */
  columnKey: string;
  direction: CubeTableSortDirection;
}

/* ── render contexts ─────────────────────────────────────────────────────── */

export interface CubeTableCellContext<T = any> {
  row: T;
  rowKey: Key;
  rowIndex: number;
  columnKey: string;
  columnIndex: number;
  section: CubeTableRowSection;
  /** Whether the ROW is selected, matching `isRowFocused` below. */
  isSelected: boolean;
  /**
   * Not yet wired — always absent.
   *
   * Optional rather than `boolean`, because there is nowhere honest to compute
   * them from where this context is built. Focus lives in the DOM, and drop
   * state comes out of `useDropIndicator`, a hook that can only run inside the
   * row component — so populating either means moving the `render` / `cellStyles`
   * call sites into `TableRow`. Declaring them required and passing `false`
   * would just be a documented lie.
   */
  isRowFocused?: boolean;
  isDropTarget?: boolean;
}

export interface CubeTableRowContext<T = any> {
  row: T;
  rowKey: Key;
  rowIndex: number;
  section: CubeTableRowSection;
  isSelected: boolean;
  /** Not yet wired — always absent. See `CubeTableCellContext` for why. */
  isFocused?: boolean;
  isDropTarget?: boolean;
}

export interface CubeTableHeaderContext {
  columnKey: string;
  columnIndex: number;
  sort: CubeTableSortDirection | null;
  isSortable: boolean;
  isResizing: boolean;
  width: number | null;
}

/* ── column ──────────────────────────────────────────────────────────────── */

/**
 * Rich header content. Every slot maps 1:1 onto the `Item` rendered inside the
 * header `<th>`, so a header gets icon / description / tooltip / suffix /
 * actions for free.
 */
export interface CubeTableColumnHeader {
  icon?: CubeItemProps['icon'];
  rightIcon?: CubeItemProps['rightIcon'];
  prefix?: ReactNode;
  suffix?: ReactNode;
  description?: ReactNode;
  descriptionPlacement?: CubeItemProps['descriptionPlacement'];
  /** `true` = auto tooltip when the label is truncated. */
  tooltip?: CubeItemProps['tooltip'];
  actions?: ReactNode;
  /** Hide `actions` until hover/focus. @default true */
  autoHideActions?: boolean;
  theme?: CubeItemProps['theme'];
  /** Full takeover of the header cell's content. Overrides `title` and every slot. */
  render?: (ctx: CubeTableHeaderContext) => ReactNode;
  /** Overrides `column.align` for the header only. */
  align?: CubeTableAlign;
  styles?: Styles;
}

export interface CubeTableColumn<T = any> {
  /**
   * Column id. Also the default data path — dot notation is supported
   * (`'owner.name'`). Anything beyond a path needs `getValue`.
   */
  key: string;
  /** Header label. Shorthand for `header` with no extra slots. */
  title?: ReactNode;
  header?: CubeTableColumnHeader;
  /**
   * Renders `<th scope="row">` instead of `<td>`, names the row for screen
   * readers, and hosts the `rowLink` anchor. Defaults to the first
   * non-structural column when a row link is present.
   */
  isRowHeader?: boolean;

  /* sizing */
  /** Fixed width in px. Mutually exclusive with `flex`. */
  width?: number;
  /** Weight for the leftover space. @default 1 when `width` is unset */
  flex?: number;
  /** @default 150 */
  minWidth?: number;
  maxWidth?: number;
  /** Inherits the table's `isResizable`. */
  isResizable?: boolean;
  /** Stick to the start/end edge during horizontal scroll. */
  pin?: 'start' | 'end';
  /** Hide without losing width or order state. */
  isHidden?: boolean;

  /* value pipeline */
  /** @default (row) => get(row, key) */
  getValue?: (row: T, rowIndex: number) => unknown;
  /** Raw value → display text. Feeds client sort, client search and TSV copy. */
  format?: (value: any, row: T, rowIndex: number) => string;
  /** Client-side comparator over raw `getValue` results. */
  compare?: (a: any, b: any, rowA: T, rowB: T) => number;

  /* rendering */
  /** A returned string is wrapped in a truncating `TextItem`. */
  render?: (
    value: any,
    row: T,
    rowIndex: number,
    ctx: CubeTableCellContext<T>,
  ) => ReactNode;
  cellStyles?: Styles | ((ctx: CubeTableCellContext<T>) => Styles | undefined);
  cellProps?: (ctx: CubeTableCellContext<T>) => Record<string, any> | undefined;

  /* behaviour */
  align?: CubeTableAlign;
  /** @default true unless the table's `sortMode` is `'off'` */
  isSortable?: boolean;
  /** Two-state cycling (asc ↔ desc), never back to unsorted. @default false */
  disallowSortRemoval?: boolean;
  /** Include in the built-in client search. @default true */
  isSearchable?: boolean;
  /** Include in TSV copy. @default true */
  isCopyable?: boolean;
  /** Wrap text and let the row grow to fit. */
  autoHeight?: boolean;

  /** Consumer-owned bag. Never reaches the DOM. */
  meta?: Record<string, unknown>;
}

/* ── resolved layout (internal, but exported for adapters) ───────────────── */

export interface CubeResolvedColumn<T = any>
  // `width`, `minWidth`, `maxWidth`, `flex` and `align` are all resolved here,
  // so they narrow from optional to definite and must be replaced, not extended.
  extends Omit<
    CubeTableColumn<T>,
    'width' | 'minWidth' | 'maxWidth' | 'flex' | 'align'
  > {
  /** Position among the visible leaf columns, 0-based. */
  index: number;
  /** `aria-colindex`, 1-based and document-absolute. */
  ariaColIndex: number;
  /** Resolved pixel width, or `null` while the container is unmeasured. */
  width: number | null;
  minWidth: number;
  maxWidth: number | null;
  flex: number | null;
  align: CubeTableAlign;
  /** Cumulative sticky offset in px for a pinned column. */
  pinOffset: number | null;
  /** `true` for the last pinned-start / first pinned-end column. */
  isPinEdge: boolean;
  /** Structural columns (selection, drag handle, row menu) never enter sorting,
   *  search, copy, or the value pipeline. */
  isStructural: boolean;
}

export interface CubeTableColumnLayout<T = any> {
  columns: CubeResolvedColumn<T>[];
  pinnedStartWidth: number;
  pinnedEndWidth: number;
  /** Sum of resolved widths, or `null` while unmeasured. */
  totalWidth: number | null;
  /** `true` when the columns cannot fit and the table scrolls horizontally. */
  isOverflowing: boolean;
}

/**
 * How a refresh over an existing result is presented.
 *
 * - `overlay` — keep the previous rows visible, dimmed, behind a spinner. A
 *   server page or a re-sort never blanks the table.
 * - `skeleton` — discard the previous rows and show placeholders.
 * - `none` — no visuals beyond `aria-busy`; the page owns the indicator.
 */
export type CubeTableLoadingIndicator = 'overlay' | 'skeleton' | 'none';

export type CubeTableSelectionMode = 'none' | 'single' | 'multiple';

/**
 * What the header checkbox acts on.
 *
 * - `page` — the rows on the current page.
 * - `filtered` — every row passing the current search/filter, across pages.
 * - `all` — emits the `'all'` sentinel, meaning "everything, including rows the
 *   client has not loaded". The consumer decides what that means for its query.
 */
export type CubeTableSelectAllMode = 'page' | 'filtered' | 'all';
