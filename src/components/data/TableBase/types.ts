import type { Key } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { CubeItemProps } from '../../content/Item';

export type CubeTableSortDirection = 'asc' | 'desc';
/**
 * Named row heights: 28px, 32px and 40px.
 *
 * A subset of the kit's size scale, and the same three steps `size` would give —
 * but `rowSize` moves only the ROWS. `size` also drives the header, so reaching
 * for a denser body through it drags the header down too.
 */
export type CubeTableRowSize = 'small' | 'medium' | 'large';
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
/**
 * The key a cell range identifies a row by.
 *
 * Not the consumer's row key: a pinned total is commonly the SAME record at the
 * top and the bottom (`id: 'total'`), and one flat key space collapsed the two
 * into whichever `indexOf` found first — so a range aimed at the footer total
 * resolved against the header one. The section is part of the identity here,
 * and only here; `ctx.rowKey` stays the consumer's own.
 */
export function selectionRowKey(
  section: CubeTableRowSection,
  rowKey: Key,
): Key {
  return section === 'body' ? rowKey : `${section}:${rowKey}`;
}

export interface CubeTableCellRange {
  fromRowKey: Key;
  toRowKey: Key;
  fromColumnKey: string;
  toColumnKey: string;
}

export interface CubeTableTreeRowState {
  /** Zero-based depth in the hierarchy. */
  level: number;
  parentKey: Key | null;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface CubeTableRowExpandInfo<T = any> {
  row: T;
  rowKey: Key;
  level: number;
  parentKey: Key | null;
  expanded: boolean;
}

/** Shared root sizing contract used by both table adapters. */
export interface CubeTableLayoutProps {
  /**
   * Shrink-wraps the frame to its rendered rows instead of filling the
   * available flex pane. This mode disables virtualization because there is no
   * bounded vertical viewport to virtualize against.
   *
   * @default false
   */
  isAutoHeight?: boolean;
}

/** Shared opt-in hierarchy contract used by both table adapters. */
export interface CubeTableTreeProps<T = any> {
  /**
   * Returns a row's already-loaded children. Supplying this enables tree mode
   * and makes `data` the top-level row collection.
   */
  getRowChildren?: (row: T) => readonly T[] | undefined;
  /** Column that owns the indentation and disclosure control. */
  treeColumnKey?: string;
  /** Controlled expanded row keys. */
  expandedKeys?: Key[];
  /** Initially expanded row keys. */
  defaultExpandedKeys?: Key[];
  /** Called after a user expands or collapses a row. */
  onExpand?: (keys: Key[], info: CubeTableRowExpandInfo<T>) => void;
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
  /** Present only when `getRowChildren` enables tree mode. */
  tree?: CubeTableTreeRowState;
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
  /** Present only when `getRowChildren` enables tree mode. */
  tree?: CubeTableTreeRowState;
}

export interface CubeTableHeaderContext {
  columnKey: string;
  columnIndex: number;
  sort: CubeTableSortDirection | null;
  isSortable: boolean;
  isResizing: boolean;
  width: number | null;
}

/** Presentational path entry used to build multi-row column headers. */
export interface CubeTableColumnGroupHeader {
  key: string;
  title?: ReactNode;
}

/* ── column ──────────────────────────────────────────────────────────────── */

/**
 * Rich header content. Every slot except `menu` maps 1:1 onto the `Item`
 * rendered inside the header `<th>`, so a header gets icon / description /
 * tooltip / suffix / actions for free; `menu` is mounted into that `Item`'s
 * `actions` slot behind a `⋮` trigger.
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
  /**
   * A column menu, opened from a `⋮` trigger in the header's actions slot and —
   * unless the table says otherwise — by right-click or Shift+F10.
   *
   * `Menu.Item` children. Opaque: the table mounts the node and reports the
   * pressed key back through `onColumnMenuAction`, so what a "pin" or a "drill
   * down" means stays in the consuming app. The exception is the reserved sort
   * keys (`sort-asc`, `sort-desc`, `clear-sort`), which the table labels,
   * disables when redundant, and applies itself before telling the consumer.
   *
   * An empty menu renders no trigger at all, rather than one that opens nothing.
   * Ignored when `header.render` takes the cell over.
   */
  menu?: ReactNode;
  /** Props for the `⋮` trigger. Merged over the table's `columnMenuTriggerProps`. */
  menuTriggerProps?: Record<string, any>;
  /** Props for the `Menu`. Merged over the table's `columnMenuProps`. */
  menuProps?: Record<string, any>;
  /** Called before the table-level `onColumnMenuAction`. */
  onMenuAction?: (action: string) => void;
  theme?: CubeItemProps['theme'];
  /**
   * Full takeover of the header cell's content. Overrides `title` and every
   * slot — including `actions` and `menu`, which are simply not rendered. A
   * takeover that wants a menu owns the trigger too.
   */
  render?: (ctx: CubeTableHeaderContext) => ReactNode;
  /** Overrides `column.align` for the header only. */
  align?: CubeTableAlign;
  styles?: Styles;
}

/* ── column colour ───────────────────────────────────────────────────────── */

/**
 * A palette theme a column can borrow its tint from.
 *
 * Resolved through the same runtime generator as a custom colour, seeded from the
 * theme's own hue and saturation in `palette-config` — so it tracks a re-seeded
 * palette, and it gets the banding step the palette itself does not define.
 *
 * `special` is absent deliberately: it is a standalone `mode: 'fixed'` theme with
 * no tinted-surface ramp to borrow.
 */
export type CubeTableColumnTheme =
  | 'primary'
  | 'purple'
  | 'success'
  | 'danger'
  | 'warning'
  | 'note';

/**
 * How a column is tinted.
 *
 * Every form but the last is *derived*: only a hue and a saturation are kept, and
 * the tone ramp plus an `AA`/`AAA` text floor are re-solved per colour scheme. So
 * a column stays readable in light, dark and high contrast without the caller
 * checking — which is the part hand-picked hex pairs get wrong.
 */
export type CubeTableColumnColor =
  /** A palette theme name. */
  | CubeTableColumnTheme
  /** Any colour Glaze parses — hex, `rgb()`, `hsl()`, `okhsl()`, `oklch()`. */
  | (string & {})
  /** The seed said directly. `saturation` is 0–100. */
  | { hue: number; saturation?: number }
  /**
   * Full manual control, as tasty colour strings (`'#note-surface'`, `'#purple.10'`).
   *
   * Nothing is derived and nothing is contrast-checked — this is the escape
   * hatch, and readability in every scheme becomes the caller's problem.
   * `fillBand` defaults to `fill`, which turns banding off for the column.
   */
  | { fill: string; fillBand?: string; text?: string };

/**
 * Which parts of a column `color` reaches.
 *
 * @default ['header','body','totals']
 */
export type CubeTableColumnColorScope = 'header' | 'body' | 'totals';

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
  /**
   * Inherits the table's `isColumnReorderable`; `false` pins this column in
   * place while the others still move around it.
   */
  isReorderable?: boolean;
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

  /**
   * Tints the column — header, cells and pinned totals — with an adaptive fill
   * and a text colour solved to stay readable on it in every scheme.
   *
   * Row banding survives: the tint carries its own band one tone step away, so
   * the stripe still reads down the column instead of being painted over.
   */
  color?: CubeTableColumnColor;
  /** Narrows what `color` reaches. @default ['header','body','totals'] */
  colorScope?: readonly CubeTableColumnColorScope[];

  /* behaviour */
  align?: CubeTableAlign;
  /**
   * Opt IN, per column — a table is not sortable until at least one column says
   * so, and `sortMode` then defaults to `'client'`.
   *
   * (This read `@default true` for a long time, which was never what the code
   * did: `TableView` requires `isSortable === true` before a header becomes a
   * control at all.)
   *
   * @default false
   */
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
