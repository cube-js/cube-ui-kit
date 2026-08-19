import { useResizeObserver } from '@react-aria/utils';
import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  forwardRef,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useFocusWithin } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import {
  BoardEntry,
  BoardGridLinesContext,
  BoardMetrics,
  BoardMetricsContext,
  useBoardGridLines,
  useBoardHost,
  useBoardMetrics,
  useBoardRegistry,
} from './board-context';
import { BoardProvider } from './BoardProvider';
import {
  applySizeConstraints,
  bottom,
  calcGridColWidth,
  calcGridItemPosition,
  calcWH,
  cloneLayout,
  CollisionMode,
  Compactor,
  CompactType,
  correctBounds,
  defaultConstraints,
  getAllCollisions,
  getCompactor,
  getLayoutItem,
  LayoutConstraint,
  LayoutItem,
  modifyLayout,
  Position,
  PositionParams,
  ResizeHandleAxis,
} from './grid-core';
import { useBoardLayout } from './use-board-layout';
import { useBoardSelectModifierKey } from './use-board-select-modifier-key';
import { BoardSelectionMode, useBoardSelection } from './use-board-selection';
import { ResizePhase, WidgetHost } from './WidgetHost';

import type { BoardResizeGripPlacement, CubeBoardWidgetProps } from './Widget';

const BoardElement = tasty({
  qa: 'Board',
  styles: {
    position: 'relative',
    display: 'block',
    width: '100%',
    flexGrow: 1,
    height: 'min 0',
    fill: '#surface',
    boxSizing: 'border-box',
    // The board takes focus programmatically (never by Tab — it is `tabIndex=-1`)
    // as a parking spot: after `onWidgetsDelete` the focused widget host is
    // about to unmount, and after a marquee focus is nowhere near the board, so
    // in both cases Escape and Delete — handled here rather than on `document` —
    // would have nothing to reach. A focus ring on a parking spot is noise: it
    // announces a state the user cannot act on and did not ask for. Same reason
    // `Dialog` drops it on its own focusable container.
    outline: 0,
    // A lasso is a widget gesture, not a text gesture: without this, dragging a
    // band across the widgets paints a native text selection under it and leaves
    // stray highlighted text behind. `WidgetHost` does the same for a widget
    // drag (`'drag | resizing'`), which the marquee never goes through.
    userSelect: {
      '': 'auto',
      marquee: 'none',
    },
  },
});

const ContentLayer = tasty({
  styles: {
    position: 'absolute',
    inset: 0,
  },
});

// The drop-slot preview. `#primary` rather than the legacy `#purple` alias -
// same hue, current token. It has to stay distinguishable from a *selected*
// widget (a tint + solid border + ring, see `WidgetHost`) and from a live
// marquee (dashed), since all three can be on screen at once.
const PlaceholderElement = tasty({
  qa: 'BoardPlaceholder',
  styles: {
    position: 'absolute',
    top: 0,
    left: 0,
    fill: '#primary.10',
    radius: '1cr',
    border: '#primary.40',
    zIndex: 2,
    pointerEvents: 'none',
    transition: 'inset 80ms linear, width 80ms linear, height 80ms linear',
    boxSizing: 'border-box',
  },
});

// The rubber-band selection rectangle. Dashed is the discriminator: nothing else
// on a board is dashed, and it reads as a transient lasso rather than a place
// something is about to land. Sits above the widgets (1) and the placeholder (2).
const MarqueeElement = tasty({
  qa: 'BoardMarquee',
  styles: {
    position: 'absolute',
    top: 0,
    left: 0,
    fill: '#primary-accent-surface.06',
    border: '1bw dashed #primary-border',
    radius: '1cr',
    zIndex: 3,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  },
});

// Visually-hidden live region. Selection changes are announced here because a
// board widget cannot carry `aria-selected`: that attribute is only valid on
// collection roles (`option`, `gridcell`, `row`, …) whose children must be
// presentational, and widgets host arbitrary interactive content. This element
// also owns the shared "Selected" hint every selected host points at via
// `aria-describedby`.
const A11yLayer = tasty({
  styles: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: 0,
  },
});

// Grid overlay drawn behind the widgets. Each snap cell is painted as a faint
// block (column stripes intersected with a row-band alpha mask); the margin gaps
// between cells stay transparent. The element is positioned as an explicit
// rectangle inset by the board's resolved padding and sized to the grid content
// so the padding reads as a symmetric frame on every edge. Its size, position
// and gradients come from the board's position params via inline `style`. The
// fill uses the `#border` token (via its CSS var) so it adapts to the scheme.
const GridOverlayElement = tasty({
  qa: 'BoardGridOverlay',
  styles: {
    position: 'absolute',
    zIndex: 0,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    opacity: '.5',
  },
});

export type BoardCompactType = 'vertical' | 'horizontal' | 'free' | null;

/**
 * Payload passed to the drag/resize lifecycle callbacks. `layout` is the board's
 * current layout at the moment the callback fires, `item` is the affected item
 * (falls back to `oldItem` if the item just left this board via a cross-board
 * transfer), `oldItem` is that item as it was when the gesture started, and
 * `placeholder` is the current drop-slot preview (if any).
 *
 * The plural fields describe the whole gesture: a group drag moves every
 * selected widget at once, so `items`/`oldItems`/`placeholders` list them all,
 * grabbed widget first. An ordinary drag or a resize produces exactly one entry,
 * so `items[0] === item` and `placeholders[0] === placeholder` always hold.
 */
export interface BoardInteractionInfo {
  layout: LayoutItem[];
  item: LayoutItem;
  oldItem: LayoutItem;
  placeholder: LayoutItem | null;
  /** Every item in this gesture, grabbed first. */
  items: LayoutItem[];
  /** Those items as they were when the gesture started, same order. */
  oldItems: LayoutItem[];
  /** Every drop-slot preview. Empty exactly when `placeholder` is `null`. */
  placeholders: LayoutItem[];
}

/** Visibility of the internal grid-line overlay. */
export type BoardGridLines = boolean | 'drag' | 'any-drag';

/**
 * The subset of `Board.Widget` props a `Board` can set as defaults for every
 * widget it hosts (via `widgetProps`). Excludes `id`/`children`, which are
 * per-widget. Per-widget `Board.Widget` props override these.
 */
export type CubeBoardWidgetDefaults = Omit<
  CubeBoardWidgetProps,
  'id' | 'children'
>;

export interface CubeBoardProps
  extends Omit<
      AllBaseProps,
      'children' | 'onDragStart' | 'onDrag' | 'onResize'
    >,
    Omit<ContainerStyleProps, 'margin'> {
  /** Stable board id (used for cross-board drag). Auto-generated if omitted. */
  id?: string;
  /** Controlled layout. */
  layout?: LayoutItem[];
  /** Initial layout for uncontrolled usage. */
  defaultLayout?: LayoutItem[];
  onLayoutChange?: (layout: LayoutItem[]) => void;
  /** Called when a drag gesture starts. */
  onDragStart?: (info: BoardInteractionInfo) => void;
  /** Called on every step of a drag gesture. */
  onDrag?: (info: BoardInteractionInfo) => void;
  /** Called when a drag gesture ends (after the layout is committed). */
  onDragStop?: (info: BoardInteractionInfo) => void;
  /** Called when a resize gesture starts. */
  onResizeStart?: (info: BoardInteractionInfo) => void;
  /** Called on every step of a resize gesture. */
  onResize?: (info: BoardInteractionInfo) => void;
  /** Called when a resize gesture ends (after the layout is committed). */
  onResizeStop?: (info: BoardInteractionInfo) => void;
  /** Number of columns. @default 12 */
  cols?: number;
  /** Row height in pixels. @default 100 */
  rowHeight?: number;
  /** [horizontal, vertical] margin between widgets in pixels. @default [8, 8] */
  margin?: [number, number];
  /**
   * [horizontal, vertical] padding inside the board. Defaults to `margin`, or
   * to `[0, 0]` for an aligned nested board (`isAligned`) so its grid lines up
   * with the ancestor board's.
   */
  containerPadding?: [number, number];
  /** Maximum number of rows. @default Infinity */
  maxRows?: number;
  /**
   * Empty grid rows kept below the content. The board renders this many rows
   * taller than its widgets need, so there is always somewhere to start a
   * marquee and somewhere to drop a widget past the end — a board that hugs its
   * content has neither once the grid is full. Clamped by `maxRows`.
   * @default 0
   */
  extraRows?: number;
  /**
   * Compaction behavior. `'vertical'` / `'horizontal'` reflow widgets to remove
   * gaps; `'free'` places each widget exactly where dropped and never pushes its
   * neighbours (pair with `allowOverlap` to let widgets stack, otherwise moving
   * onto an occupied cell is blocked); `null` disables compaction but still
   * resolves collisions the legacy react-grid-layout way. @default 'vertical'
   */
  compact?: BoardCompactType;
  /** Allow widgets to overlap. @default false */
  allowOverlap?: boolean;
  /** Block movement into occupied cells instead of pushing. @default false */
  preventCollision?: boolean;
  /**
   * How to resolve a drop the grid would otherwise refuse. Only applies where a
   * collision blocks a move - `compact="free"` (which prevents collisions) or an
   * explicit `preventCollision` - and never under `allowOverlap`. `'revert'`
   * snaps the widget back, `'downscale'` shrinks it into the free space at the
   * drop cell, `'swap'` trades places with one widget - the one the drop covers
   * most - which takes the cell the drag began at (falling back to `'downscale'`,
   * then `'revert'`). No mode ever grows a widget, `'swap'` never displaces more
   * than that one widget, and a drop that spans two widgets trades with one of
   * them rather than refusing, so the swap never blinks away mid-drag.
   *
   * Applies to single-widget drags. Arrow keys honour it too, but never resize
   * anything: each press is a gesture of its own, so a press that shrank a widget
   * would have nothing to restore from. A multi-widget selection still only moves
   * where it fits outright, and a resize is still blocked by a collision.
   * @default 'revert'
   */
  collisionMode?: CollisionMode;
  /** Enable dragging for all widgets. @default true */
  isDraggable?: boolean;
  /** Enable resizing for all widgets. @default true */
  isResizable?: boolean;
  /** Whether this board accepts widgets dropped from other boards. @default true */
  isDroppable?: boolean;
  /** Which resize handles to show. @default ['se'] */
  resizeHandles?: ResizeHandleAxis[];
  /**
   * Where the corner resize grips sit: `'inside'` tucks them into the widget
   * box, `'corner'` centres each one on the widget's corner so it lines up with a
   * control centred on the opposite corner. Only affects corner handles. Can be
   * overridden per widget on `Board.Widget`.
   * @default 'inside'
   */
  resizeGripPlacement?: BoardResizeGripPlacement;
  /**
   * CSS selector for elements that must not start a pointer drag (e.g. form
   * controls inside a widget: `"input,textarea,button,a,.no-drag"`). Does not
   * affect keyboard moves — those only run when the widget host itself is
   * focused. Can be overridden per widget on `Board.Widget`.
   */
  dragCancel?: string;
  /**
   * CSS selector for the only elements from which a pointer drag may start.
   * Can be overridden per widget on `Board.Widget`.
   */
  dragHandle?: string;
  /**
   * Show grid lines behind the widgets. `true` always shows them, `false` never,
   * `'drag'` only while *this* board is part of the active gesture - it owns the
   * drag (as its source or as the board the widget is currently over), or one of
   * its own widgets is being resized. `'any-drag'` widens that to any drag
   * anywhere under a shared `Board.Provider`, so every board advertises itself as
   * a place the widget could land.
   * @default false
   */
  showGridLines?: BoardGridLines;
  /**
   * Align this board's grid with an ancestor `Board`'s layout. Only takes
   * effect when the board is nested inside another `Board`'s widget. When set,
   * every cell matches the parent's cell size exactly: the board inherits the
   * parent's column pitch (deriving its own column count from its measured
   * width) and uses the parent's row height verbatim. It never shrinks rows to
   * fit; pair it with an `isAutoHeight` container so the widget grows to fit its
   * rows at that height. @default false
   */
  isAligned?: boolean;
  /**
   * Whether widgets can be selected, and how many at a time. `'multiple'` also
   * enables the marquee and rigid group movement: dragging any selected widget
   * moves the whole selection. @default 'none'
   */
  selectionMode?: BoardSelectionMode;
  /** Controlled selection. Keys are layout item ids (`LayoutItem.i`). */
  selectedKeys?: string[];
  /** Initial selection for uncontrolled usage. */
  defaultSelectedKeys?: string[];
  /**
   * Called when the selection changes. Keys are deduped and returned in the
   * board's layout order, never in click order.
   */
  onSelectionChange?: (keys: string[]) => void;
  /**
   * CSS selector for descendants whose clicks must never change the selection
   * (form controls, buttons, links). Mirrors `dragCancel`; can be overridden per
   * widget. Pass `''` to disable the guard entirely.
   * @default BOARD_SELECTION_CANCEL
   */
  selectionCancel?: string;
  /**
   * Draw a rubber-band (marquee) selection when a drag starts on empty board
   * space. Only meaningful with `selectionMode="multiple"`.
   * @default selectionMode === 'multiple'
   */
  allowMarqueeSelection?: boolean;
  /**
   * Called when the user presses <kbd>Delete</kbd>/<kbd>Backspace</kbd> with a
   * non-empty selection, and focus is inside the board but not in an editable
   * field. Board never mutates the layout itself — removing the widgets is the
   * consumer's job. Board only handles these keys when this handler is set.
   */
  onWidgetsDelete?: (keys: string[]) => void;
  /** Grid/item layout constraints. */
  constraints?: LayoutConstraint[];
  /**
   * Explicit container width in pixels. When provided, disables automatic width
   * measurement (useful for SSR and tests).
   */
  width?: number;
  /**
   * Default props applied to every widget this board hosts. Per-widget
   * `Board.Widget` props override these. Use it to add a card border to every
   * widget (`widgetProps={{ isCard: true }}`) or set shared sizing/`styles`
   * defaults without repeating them on each `Board.Widget`.
   */
  widgetProps?: Partial<CubeBoardWidgetDefaults>;
  children?: ReactNode;
}

/**
 * Descendants whose clicks never change the selection. A widget is a large
 * surface the user also clicks to *work with*, so anything interactive inside it
 * must keep its click. `[data-no-select]` is the escape hatch for an app's own
 * custom controls.
 */
export const BOARD_SELECTION_CANCEL =
  'input,textarea,select,button,a,[role="button"],[role="menuitem"],' +
  '[role="checkbox"],[role="switch"],[role="tab"],[contenteditable="true"],' +
  '[data-no-select]';

/** Manhattan distance a pointer must travel before a press becomes a marquee. */
const MARQUEE_THRESHOLD = 4;

/** Shared empty set, so "no pre-selection" is a stable reference. */
const NO_KEYS: ReadonlySet<string> = new Set();

/**
 * Whether an event landed in a text-editing context. Checking the *event target*
 * beats `document.activeElement`: it stays correct for content rendered through
 * a portal, and it cannot be fooled by focus that moved between the keystroke
 * and the handler.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;

  return !!el.closest('input,textarea,select,[contenteditable="true"]');
}

function compactTypeToCore(compact: BoardCompactType): CompactType {
  if (compact === 'free') return null;
  return compact;
}

function BoardInner(
  props: CubeBoardProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id: providedId,
    layout: controlledLayout,
    defaultLayout,
    onLayoutChange,
    onDragStart,
    onDrag,
    onDragStop,
    onResizeStart,
    onResize: onResizeProp,
    onResizeStop,
    cols = 12,
    rowHeight = 100,
    margin = [8, 8],
    containerPadding,
    maxRows = Infinity,
    extraRows = 0,
    compact = 'vertical',
    allowOverlap = false,
    preventCollision = false,
    collisionMode = 'revert',
    isDraggable = true,
    isResizable = true,
    isDroppable = true,
    resizeHandles = ['se'],
    resizeGripPlacement = 'inside',
    dragCancel,
    dragHandle,
    showGridLines,
    isAligned = false,
    selectionMode = 'none',
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    selectionCancel = BOARD_SELECTION_CANCEL,
    allowMarqueeSelection = selectionMode === 'multiple',
    onWidgetsDelete,
    constraints,
    width: providedWidth,
    widgetProps,
    children,
    ...otherProps
  } = props;

  const registry = useBoardRegistry()!;
  const parentMetrics = useBoardMetrics();
  const host = useBoardHost();
  const inheritedGridLines = useBoardGridLines();
  const aligned = isAligned && !!parentMetrics;
  // `widgetProps` may carry container style props directly (e.g. `fill`,
  // `padding`, `radius`) alongside an explicit `styles` object, mirroring
  // `Board.Widget`. Extract them into a single style map here so those defaults
  // actually reach every widget - forwarding only `widgetProps.styles` would
  // drop the direct props. A direct prop wins over the same key in `styles`.
  const widgetPropsStyles = useMemo<Styles | undefined>(() => {
    if (!widgetProps) return undefined;
    const extracted = extractStyles(widgetProps, CONTAINER_STYLES);
    return Object.keys(extracted).length > 0 ? extracted : undefined;
  }, [widgetProps]);
  // A nested board with no explicit `showGridLines` inherits the ancestor's:
  // when the ancestor has grid lines enabled, show them here while dragging, at
  // the ancestor's own drag scope (see `BoardInheritedGridLines`).
  const effectiveShowGridLines: BoardGridLines =
    showGridLines ?? inheritedGridLines;
  const generatedId = useId();
  const boardId = providedId ?? generatedId;
  // One shared description node for every selected widget, so marking a widget
  // selected costs no per-widget DOM.
  const selectedHintId = `${generatedId}-selected`;
  const { t } = useI18n();

  const containerRef = useCombinedRefs(ref);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  // Rendered height is only needed for aligned nested boards (to fit rows into
  // the space the container grants). It never drives the board's own height, so
  // measuring it cannot create a feedback loop.
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  const width = providedWidth ?? measuredWidth;

  const onResizeContainer = useEvent(() => {
    const el = containerRef.current;
    if (!el) return;
    // A hidden container (e.g. the board inside an inactive tab after a
    // spring-loaded tab switch) reports 0. Keep the last non-zero measurement so
    // the board stays "ready" and keeps its widget hosts mounted while briefly
    // hidden. Otherwise the board would render nothing, unmounting the widget
    // that owns an in-flight drag gesture and stranding the drag (React Aria's
    // `useMove` tears down its listeners on unmount, so the drop never fires).
    const nextWidth = el.offsetWidth;
    const nextHeight = el.offsetHeight;
    if (nextWidth > 0) setMeasuredWidth(nextWidth);
    if (nextHeight > 0) setMeasuredHeight(nextHeight);
  });
  useResizeObserver({ ref: containerRef, onResize: onResizeContainer });
  useEffect(() => {
    if (providedWidth == null) {
      onResizeContainer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedWidth]);

  const {
    layout,
    layoutRef,
    placeholders,
    placeholder,
    placeholdersRef,
    placeholderRef,
    setPlaceholders,
    applyLayout,
  } = useBoardLayout({
    layout: controlledLayout,
    defaultLayout,
    onLayoutChange,
  });

  // The accessible name a widget announces under. Mirrors `WidgetHost`'s own
  // fallback chain so the live region and the host never disagree.
  const getWidgetLabel = useEvent((key: string) => {
    const registration = registry.store.get(key);

    return registration?.['aria-label'] ?? registration?.qa ?? key;
  });

  // Whether a widget accepts selection at all. Every selection path resolves it
  // here — press, keyboard and marquee — so a lasso can never pick up a widget
  // that a press cannot.
  const isWidgetSelectable = (key: string) =>
    (registry.store.get(key)?.isSelectable ?? widgetProps?.isSelectable) !==
    false;

  const {
    selectedKeySet,
    selectedKeysRef,
    setSelection,
    select,
    clearSelection,
    announcement,
  } = useBoardSelection({
    selectionMode,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    layout,
    getLabel: getWidgetLabel,
  });

  const selectModifierKey = useBoardSelectModifierKey();

  // Re-render when any widget's registered content/config changes.
  useSyncExternalStore(registry.store.subscribe, registry.store.getVersion);

  // In aligned mode the board inherits the parent's gap so widget edges line up
  // with the surrounding layout; otherwise it uses its own `margin`.
  const effectiveMargin: readonly [number, number] = aligned
    ? parentMetrics!.margin
    : margin;
  // The board keeps its own padding (it sits inside the container's chrome);
  // when unspecified it defaults to the effective gap. An aligned nested board
  // is the exception: its grid origin must sit flush on the container widget's
  // edge (which already coincides with the parent's column-0 origin) so its
  // columns line up with the ancestor board's. Inheriting the gap there would
  // inset every column by one margin and break the alignment, so it defaults
  // to zero padding instead.
  const resolvedPadding: readonly [number, number] =
    containerPadding ?? (aligned ? [0, 0] : effectiveMargin);

  const rows = Math.max(
    bottom(layout),
    ...placeholders.map((p) => p.y + p.h),
    0,
  );

  // Rows the board actually paints. `rows` stays the *content* extent — layout
  // math must not see the reserved band — while this is the extent the board
  // renders, so the band is real board surface: `ContentLayer` (inset: 0)
  // covers it, which is what lets a marquee start there and a widget be dropped
  // past the end.
  const renderedRows = Math.min(rows + Math.max(0, extraRows), maxRows);

  // Derive the aligned column count so each column keeps the parent's pixel
  // pitch: as the container widget is resized, columns are added/removed rather
  // than stretched. `containerWidth` is then back-solved so `calcGridColWidth`
  // returns exactly the parent's column width.
  const parentColWidth = aligned ? parentMetrics!.colWidth : 0;
  // `width` is `offsetWidth` (an integer the browser rounds), while
  // `parentColWidth` is fractional. A container sized to exactly N parent
  // columns can therefore measure a fraction of a pixel short, so a bare
  // `Math.floor` would drop the last column and leave its space unused. Add a
  // small pixel tolerance to absorb that rounding; it only rounds up when the
  // width is within ~2px of a full column, so it can't invent a column that
  // genuinely doesn't fit.
  const ALIGN_WIDTH_TOLERANCE = 2;
  const alignedCols =
    aligned && width > 0
      ? Math.max(
          1,
          Math.floor(
            (width -
              resolvedPadding[0] * 2 +
              effectiveMargin[0] +
              ALIGN_WIDTH_TOLERANCE) /
              (parentColWidth + effectiveMargin[0]),
          ),
        )
      : cols;
  const effectiveCols = aligned ? alignedCols : cols;
  const effectiveContainerWidth = aligned
    ? parentColWidth * effectiveCols +
      effectiveMargin[0] * Math.max(0, effectiveCols - 1) +
      resolvedPadding[0] * 2
    : width;

  // An aligned board uses the parent's row height verbatim, so every cell is
  // exactly the parent's cell size (width already matches via the inherited
  // column pitch). It never shrinks rows to fit; pair it with an `isAutoHeight`
  // container so the widget grows to fit the rows at this height instead.
  const effectiveRowHeight = aligned ? parentMetrics!.rowHeight : rowHeight;

  const positionParams = useMemo<PositionParams>(
    () => ({
      margin: effectiveMargin,
      containerPadding: resolvedPadding,
      containerWidth: effectiveContainerWidth,
      cols: effectiveCols,
      rowHeight: effectiveRowHeight,
      maxRows,
    }),
    [
      effectiveMargin[0],
      effectiveMargin[1],
      resolvedPadding[0],
      resolvedPadding[1],
      effectiveContainerWidth,
      effectiveCols,
      effectiveRowHeight,
      maxRows,
    ],
  );

  // 'free' means no compaction (nothing is pushed up/left or recompacted) AND a
  // dragged widget never pushes or swaps its neighbours: it is placed exactly
  // where dropped. Without `allowOverlap` a move onto an occupied cell is
  // blocked (the widget stays at its last free spot); with `allowOverlap`
  // widgets may stack. The explicit `preventCollision` prop still applies to the
  // compacting modes (`vertical` / `horizontal`) and to the legacy `null` mode.
  const compactor = useMemo<Compactor>(
    () =>
      getCompactor(
        compactTypeToCore(compact),
        allowOverlap,
        compact === 'free' ? !allowOverlap : preventCollision,
      ),
    [compact, allowOverlap, preventCollision],
  );

  const resolvedConstraints = constraints ?? defaultConstraints;

  const computedHeight =
    renderedRows > 0
      ? renderedRows * effectiveRowHeight +
        Math.max(0, renderedRows - 1) * effectiveMargin[1] +
        resolvedPadding[1] * 2
      : effectiveRowHeight;
  // An aligned board fills the height the container grants it, so it reports its
  // measured height; otherwise it reports the height its content needs.
  const containerHeight =
    aligned && measuredHeight > 0 ? measuredHeight : computedHeight;

  // Live refs so the stable registry entry always reads current values.
  const liveRef = useRef({
    positionParams,
    compactor,
    collisionMode,
    constraints: resolvedConstraints,
    maxRows,
    containerHeight,
    isDroppable,
  });
  liveRef.current = {
    positionParams,
    compactor,
    collisionMode,
    constraints: resolvedConstraints,
    maxRows,
    containerHeight,
    isDroppable,
  };

  const applyLayoutEvent = useEvent(applyLayout);
  const setPlaceholdersEvent = useEvent(setPlaceholders);

  const entryRef = useRef<BoardEntry | null>(null);
  if (!entryRef.current) {
    entryRef.current = {
      id: boardId,
      getContentRect: () => contentRef.current?.getBoundingClientRect() ?? null,
      getContentNode: () => contentRef.current,
      getPositionParams: () => liveRef.current.positionParams,
      getConstraints: () => liveRef.current.constraints,
      getCompactor: () => liveRef.current.compactor,
      getCollisionMode: () => liveRef.current.collisionMode,
      getMaxRows: () => liveRef.current.maxRows,
      getContainerHeight: () => liveRef.current.containerHeight,
      getLayout: () => layoutRef.current,
      // The registry reads this synchronously at drag start, so it must be the
      // ref rather than the rendered value.
      getSelectedKeys: () =>
        selectedKeysRef.current.size > 0 ? selectedKeysRef.current : null,
      applyLayout: (next, commit) => applyLayoutEvent(next, commit),
      setPlaceholders: (items) => setPlaceholdersEvent(items),
      isDroppable: () => liveRef.current.isDroppable,
    };
  }

  useEffect(() => {
    const entry = entryRef.current!;
    // Keep the entry's id in sync with the (possibly changed) board id before
    // registering. The previous effect's cleanup has already removed the old id,
    // so registering here keys the entry under the current id.
    entry.id = boardId;
    return registry.registerBoard(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // When the aligned column count changes (the container was resized), reflow
  // the layout to the new width: clamp items back into bounds and recompact so
  // nothing overflows the narrower/wider grid.
  const recompactForCols = useEvent((nextCols: number) => {
    const corrected = correctBounds(cloneLayout(layoutRef.current), {
      cols: nextCols,
    });
    const compacted = [
      ...liveRef.current.compactor.compact(corrected, nextCols),
    ];
    applyLayoutEvent(compacted, true);
  });
  // `null` until the first *measured* aligned column count is established. This
  // avoids treating the initial zero-width -> measured-width transition as a
  // column-count change: a board that measures its own width (no explicit
  // `width` prop) renders first with `width === 0`, so `effectiveCols` falls
  // back to `cols` and only becomes the derived aligned count once measured.
  // Seeding the baseline on that first measured value (without committing)
  // prevents an unsolicited reflow + `onLayoutChange` before the user interacts.
  const prevAlignedColsRef = useRef<number | null>(null);
  useEffect(() => {
    if (!aligned) {
      // Re-entering aligned mode should re-seed from the next measured value.
      prevAlignedColsRef.current = null;
      return;
    }
    // Wait for a real width measurement; the fallback-`cols` value that stands
    // in before measurement is not a meaningful aligned column count.
    if (width <= 0) return;
    if (prevAlignedColsRef.current === null) {
      prevAlignedColsRef.current = effectiveCols;
      return;
    }
    if (prevAlignedColsRef.current === effectiveCols) return;
    prevAlignedColsRef.current = effectiveCols;
    recompactForCols(effectiveCols);
  }, [aligned, width, effectiveCols, recompactForCols]);

  // Natural height this board wants: its rows at the (parent) row height. When
  // the container is shorter than this, an `isAutoHeight` host grows to fit it
  // (aligned boards no longer shrink their rows).
  const naturalHeight =
    renderedRows > 0
      ? renderedRows * effectiveRowHeight +
        Math.max(0, renderedRows - 1) * effectiveMargin[1] +
        resolvedPadding[1] * 2
      : effectiveRowHeight;

  // Report this aligned board's height deficit to an auto-sizing host so the
  // host can both grow to fit and pin its resize floor. The value is signed:
  // positive when the board is squeezed (needs more height), negative when the
  // container is taller than needed (so the floor can be lowered). The host
  // never shrinks the widget on its own - it only grows and clamps resizing.
  const requestHeightDeficit = host?.requestHeightDeficit;
  useEffect(() => {
    if (!aligned || !host?.isAutoHeight || !requestHeightDeficit) return;
    if (measuredHeight <= 0) return;
    requestHeightDeficit(naturalHeight - measuredHeight);
  }, [
    aligned,
    host?.isAutoHeight,
    requestHeightDeficit,
    naturalHeight,
    measuredHeight,
  ]);

  // In-board resize orchestration.
  const resizeStateRef = useRef<{
    id: string;
    axis: ResizeHandleAxis;
    item: LayoutItem;
    origin: Position;
    accX: number;
    accY: number;
  } | null>(null);

  // Minimum rows each auto-height widget currently needs to fit its content.
  // Read during resize so a widget can never be dragged shorter than its
  // content, and used to grow the item when the content needs more room.
  const autoHeightMinRowsRef = useRef<Record<string, number>>({});

  const handleResize = useEvent(
    (
      id: string,
      axis: ResizeHandleAxis,
      phase: ResizePhase,
      dx: number,
      dy: number,
    ) => {
      const pp = liveRef.current.positionParams;

      if (phase === 'start') {
        const rawItem = getLayoutItem(layoutRef.current, id);
        if (!rawItem) return;
        // Layout-item min/max and constraints win; otherwise fall back to the
        // ones declared on the owning `Board.Widget` (and then the board-level
        // `widgetProps` defaults) so `applySizeConstraints` (via `minMaxSize`)
        // picks them up.
        const reg = registry.store.get(id);
        const item: LayoutItem = {
          ...rawItem,
          minW: rawItem.minW ?? reg?.minW ?? widgetProps?.minW,
          maxW: rawItem.maxW ?? reg?.maxW ?? widgetProps?.maxW,
          minH: rawItem.minH ?? reg?.minH ?? widgetProps?.minH,
          maxH: rawItem.maxH ?? reg?.maxH ?? widgetProps?.maxH,
          constraints:
            rawItem.constraints ?? reg?.constraints ?? widgetProps?.constraints,
        };
        resizeStateRef.current = {
          id,
          axis,
          item: { ...item },
          origin: calcGridItemPosition(pp, item.x, item.y, item.w, item.h),
          accX: 0,
          accY: 0,
        };
        setPlaceholders([{ ...item }]);
        onResizeStart?.({
          layout: layoutRef.current,
          item: { ...item },
          oldItem: { ...item },
          placeholder: { ...item },
          items: [{ ...item }],
          oldItems: [{ ...item }],
          placeholders: [{ ...item }],
        });
        return;
      }

      const rs = resizeStateRef.current;
      if (!rs) return;

      if (phase === 'end') {
        const finalLayout = [...layoutRef.current];
        applyLayout(finalLayout, true);
        setPlaceholders([]);
        const resizedItem = getLayoutItem(finalLayout, id) ?? rs.item;
        onResizeStop?.({
          layout: finalLayout,
          item: resizedItem,
          oldItem: rs.item,
          placeholder: null,
          items: [resizedItem],
          oldItems: [rs.item],
          placeholders: [],
        });
        resizeStateRef.current = null;
        return;
      }

      rs.accX += dx;
      rs.accY += dy;

      const { origin, item, axis: handle } = rs;
      let newW = origin.width;
      let newH = origin.height;
      if (handle.includes('e')) newW = origin.width + rs.accX;
      if (handle.includes('w')) newW = origin.width - rs.accX;
      if (handle.includes('s')) newH = origin.height + rs.accY;
      if (handle.includes('n')) newH = origin.height - rs.accY;
      newW = Math.max(newW, 8);
      newH = Math.max(newH, 8);

      const raw = calcWH(pp, newW, newH, item.x, item.y, handle);
      const constrained = applySizeConstraints(
        liveRef.current.constraints,
        item,
        raw.w,
        raw.h,
        handle,
        {
          cols: pp.cols,
          maxRows: liveRef.current.maxRows,
          containerWidth: pp.containerWidth,
          containerHeight: liveRef.current.containerHeight,
          rowHeight: pp.rowHeight,
          margin: pp.margin,
          layout: layoutRef.current,
        },
      );

      // An auto-height widget cannot be resized shorter than the content it
      // hosts (a nested board) currently needs, so pin its height to the floor.
      const floorRows = autoHeightMinRowsRef.current[id] ?? 0;
      const finalW = constrained.w;
      const finalH = Math.max(constrained.h, floorRows);

      let x = item.x;
      let y = item.y;
      if (handle.includes('w')) x = item.x + item.w - finalW;
      if (handle.includes('n')) y = item.y + item.h - finalH;
      x = Math.max(0, x);
      y = Math.max(0, y);

      let newItem: LayoutItem = {
        ...item,
        x,
        y,
        w: finalW,
        h: finalH,
      };

      // Collision-blocking modes (`free` without `allowOverlap`, or an explicit
      // `preventCollision`) run a no-op/gap-filling compactor that never
      // resolves overlaps, so a resize must be blocked here the same way the
      // drag path blocks a move (`moveElement` reverts on collision). Without
      // this, growing or moving an edge via a resize handle could push the box
      // onto an occupied cell. When the new box overlaps a neighbour, revert to
      // the last committed box for this widget so the gesture stalls at the
      // last valid size/position instead of overlapping.
      const compactor = liveRef.current.compactor;
      if (compactor.preventCollision && !compactor.allowOverlap) {
        const collides = getAllCollisions(layoutRef.current, newItem).some(
          (other) => other.i !== id,
        );
        if (collides) {
          const lastValid = getLayoutItem(layoutRef.current, id);
          if (lastValid) newItem = { ...lastValid };
        }
      }

      const working = modifyLayout(layoutRef.current, newItem);
      const compacted = [...compactor.compact(working, pp.cols)];
      applyLayout(compacted, false);
      const nextPlaceholder = getLayoutItem(compacted, id) ?? newItem;
      setPlaceholders([nextPlaceholder]);
      const resizedItem = getLayoutItem(compacted, id) ?? newItem;
      onResizeProp?.({
        layout: compacted,
        item: resizedItem,
        oldItem: rs.item,
        placeholder: nextPlaceholder,
        items: [resizedItem],
        oldItems: [rs.item],
        placeholders: [nextPlaceholder],
      });
    },
  );

  // Record an auto-height widget's needed rows. Grow the item when its content
  // needs more height (only ever increases); the stored value is also the
  // resize floor enforced in `handleResize`.
  const handleAutoHeight = useEvent((id: string, neededRows: number) => {
    autoHeightMinRowsRef.current[id] = neededRows;
    const current = getLayoutItem(layoutRef.current, id);
    if (!current || neededRows <= current.h) return;
    // While a drag or resize gesture is in flight the layout is transient - the
    // registry (drag) and `handleResize` write uncommitted previews and commit
    // only on drop / release. Growing an auto-height widget here with
    // `commit: true` would fire `onLayoutChange` mid-gesture and persist the
    // in-flight positions of the widget being moved. Skip the grow-commit; the
    // floor ref is already updated above (so `handleResize` still respects it),
    // and the deficit effect re-fires once the gesture settles.
    if (registry.dragState || resizeStateRef.current) return;
    const pp = liveRef.current.positionParams;
    const working = modifyLayout(layoutRef.current, {
      ...current,
      h: neededRows,
    });
    const compacted = [...liveRef.current.compactor.compact(working, pp.cols)];
    applyLayout(compacted, true);
  });

  // The dragged item captured at gesture start, so drag callbacks can report the
  // original position throughout (and after a cross-board transfer removes the
  // item from this board's layout).
  const dragOldItemRef = useRef<LayoutItem | null>(null);
  // The same, for every other member of a group drag. Empty for an ordinary
  // drag, which is what keeps `items`/`oldItems` single-entry there.
  const dragOldItemsRef = useRef<LayoutItem[]>([]);

  const handleDragLifecycle = useEvent((id: string, phase: ResizePhase) => {
    const currentLayout = layoutRef.current;
    const liveItem = getLayoutItem(currentLayout, id);

    if (phase === 'start') {
      dragOldItemRef.current = liveItem ? { ...liveItem } : null;
      // The registry has already resolved the group by the time this fires, so
      // its drag state is the authority on who is moving.
      const ds = registry.getDragState();
      dragOldItemsRef.current =
        ds && ds.itemId === id ? ds.items.map((it) => ({ ...it })) : [];
    }
    const oldItem = dragOldItemRef.current ?? liveItem;
    if (!oldItem) return;
    const item = liveItem ?? oldItem;

    const oldItems = dragOldItemsRef.current.length
      ? dragOldItemsRef.current
      : [oldItem];
    const items = oldItems.map(
      (old) => getLayoutItem(currentLayout, old.i) ?? old,
    );

    const info: BoardInteractionInfo = {
      layout: currentLayout,
      item,
      oldItem,
      // Read the live refs, not render-time state: the registry calls
      // `setPlaceholders` synchronously right before this fires, and that only
      // schedules a re-render, so `placeholders` state still holds the previous
      // value (or a stale preview after the drop clears it).
      placeholder: placeholderRef.current,
      items,
      oldItems,
      placeholders: placeholdersRef.current,
    };
    if (phase === 'start') onDragStart?.(info);
    else if (phase === 'move') onDrag?.(info);
    else {
      onDragStop?.(info);
      dragOldItemRef.current = null;
      dragOldItemsRef.current = [];
    }
  });

  // ---- Marquee (rubber-band) selection --------------------------------------
  //
  // Board owns this rather than exposing hooks for an app to build it, because
  // deciding which widgets a band covers needs every widget's box — and the DOM
  // is the wrong place to read them from. Widget hosts transition `inset`/`width`
  // /`height` while the board reflows, and a host being dragged is swapped for an
  // `opacity: 0` stand-in with a fixed-position clone in the overlay, so
  // `getBoundingClientRect` during a marquee returns interpolated or misleading
  // boxes. `calcGridItemPosition` derives the same rectangles exactly, from the
  // layout, with no forced reflow and no sensitivity to ancestor transforms.
  const [marqueeRect, setMarqueeRect] = useState<Position | null>(null);
  // Which widgets the band covers *right now*. Committing only on release
  // leaves the user guessing what they are about to select, so the band drives a
  // provisional state on the hosts as it grows and shrinks. The board already
  // re-renders once per pointer frame for the band itself, so this is free.
  const [preSelectedKeys, setPreSelectedKeys] =
    useState<ReadonlySet<string>>(NO_KEYS);
  // Drives `user-select: none` for the duration of the gesture. Set on press
  // rather than at the threshold, so even a press that never becomes a marquee
  // cannot start painting a text selection.
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);

  const handleContentPointerDown = useEvent((event: React.PointerEvent) => {
    if (
      selectionMode !== 'multiple' ||
      !allowMarqueeSelection ||
      event.button !== 0 ||
      registry.dragState
    ) {
      return;
    }

    const target = event.target as HTMLElement | null;
    // A press on a widget selects it and arms a drag; the lasso owns empty
    // canvas only.
    if (target?.closest('[data-board-widget-host]')) return;
    if (selectionCancel && target?.closest(selectionCancel)) return;

    const content = contentRef.current;
    if (!content) return;

    // Suppress the compatibility mouse events that would begin a native text
    // selection. Safe here specifically because every case that wants default
    // behaviour — a widget, an interactive descendant — has already bailed out
    // above, and focus is placed explicitly in `finish`.
    event.preventDefault();
    setIsMarqueeActive(true);

    const origin = content.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    // Holding the modifier means "add to what I have"; a bare lasso replaces.
    const additive = event[selectModifierKey] || event.shiftKey;
    const base = additive ? [...selectedKeysRef.current] : [];
    let passedThreshold = false;

    const hitTest = (clientX: number, clientY: number) => {
      const left = Math.min(startX, clientX) - origin.left;
      const right = Math.max(startX, clientX) - origin.left;
      const top = Math.min(startY, clientY) - origin.top;
      const bottom = Math.max(startY, clientY) - origin.top;
      const next = new Set(base);

      for (const it of layoutRef.current) {
        if (!isWidgetSelectable(it.i)) continue;
        const pos = calcGridItemPosition(
          liveRef.current.positionParams,
          it.x,
          it.y,
          it.w,
          it.h,
        );
        if (
          pos.left < right &&
          pos.left + pos.width > left &&
          pos.top < bottom &&
          pos.top + pos.height > top
        ) {
          next.add(it.i);
        }
      }

      return {
        next,
        box: { left, top, width: right - left, height: bottom - top },
      };
    };

    // Belt and braces for the `preventDefault` above: a press that starts on
    // empty canvas and then travels into text still gets a `selectstart` in some
    // browsers, and `user-select: none` alone does not unwind a selection that is
    // already growing.
    const blockSelectStart = (e: Event) => e.preventDefault();

    const handleMove = (e: PointerEvent) => {
      if (
        !passedThreshold &&
        Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) <
          MARQUEE_THRESHOLD
      ) {
        return;
      }
      if (!passedThreshold) {
        // Drop a selection the user made inside this board *before* the lasso
        // started, so the band never drags a stale highlight along with it.
        // Scoped to this board: a selection anywhere else on the page is theirs.
        const selection = window.getSelection();
        const anchor = selection?.anchorNode;
        if (anchor && containerRef.current?.contains(anchor)) {
          selection?.removeAllRanges();
        }
      }
      passedThreshold = true;

      const { box, next } = hitTest(e.clientX, e.clientY);
      setMarqueeRect(box);
      setPreSelectedKeys(next);
    };

    const finish = (e: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('selectstart', blockSelectStart);
      setMarqueeRect(null);
      setPreSelectedKeys(NO_KEYS);
      setIsMarqueeActive(false);

      // One commit per gesture: `onSelectionChange` and the announcement fire on
      // release, never once per pointer frame.
      if (passedThreshold) {
        setSelection(hitTest(e.clientX, e.clientY).next);
      } else if (!additive) {
        // A plain click on empty board space clears.
        clearSelection();
      }
      // Keep focus somewhere inside the board so Escape has a handler to reach.
      containerRef.current?.focus({ preventScroll: true });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('selectstart', blockSelectStart);
  });

  const marqueeStyle = marqueeRect
    ? {
        left: `${marqueeRect.left}px`,
        top: `${marqueeRect.top}px`,
        width: `${marqueeRect.width}px`,
        height: `${marqueeRect.height}px`,
      }
    : null;

  // Selection is focus-like, so it does not outlive focus leaving the board.
  // Tabbing away, or clicking any focusable thing elsewhere on the page, drops
  // it — the same way a text selection or a focus ring would go.
  const { focusWithinProps: boardFocusWithinProps } = useFocusWithin({
    isDisabled: selectionMode === 'none',
    onBlurWithin: () => clearSelection(),
  });

  // ---- Board-level keys -----------------------------------------------------
  //
  // On the board element, never on `document`: a library-owned document listener
  // fires for keystrokes that never went near a board, and two boards on a page
  // would both react.
  const handleBoardKeyDown = useEvent((event: React.KeyboardEvent) => {
    if (selectionMode === 'none') return;

    const selected = selectedKeysRef.current;
    if (selected.size === 0) return;

    if (event.key === 'Escape') {
      // `preventDefault` only when we actually consumed the key, so an Escape
      // with nothing selected still closes an ancestor Dialog or Popover.
      event.preventDefault();
      event.stopPropagation();
      clearSelection();

      return;
    }

    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      onWidgetsDelete &&
      !isEditableTarget(event.target)
    ) {
      event.preventDefault();
      event.stopPropagation();
      const keys = [...selected];
      clearSelection();
      onWidgetsDelete(keys);
      // The deleted widgets' hosts are about to unmount, so focus would be left
      // on a detached node. Park it on the board.
      containerRef.current?.focus({ preventScroll: true });
    }
  });

  const styles: Styles = extractStyles(otherProps, CONTAINER_STYLES);

  const dragState = registry.dragState;
  const ready = width > 0;

  // Gate widget position transitions off until the widgets have been painted at
  // their initial positions once. Without this, the first render animates every
  // widget sliding in from its default spot (0, 0). We render one frame with the
  // gate closed (no `inset` transition), let the browser paint, then lift it so
  // later reflows animate. A double rAF waits past the first committed paint;
  // re-arm whenever the board (re)becomes ready so a board that hides and
  // remeasures (e.g. inside a tab) re-settles too.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!ready) {
      setSettled(false);
      return;
    }
    let id1 = 0;
    let id2 = 0;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [ready]);

  // When the widget that hosts this nested board is the one being dragged, its
  // whole content (including this board) floats as a single unit, so its own
  // grid lines add nothing but clutter. Suppress them for that drag.
  const hostWidgetIsDragging =
    !!dragState && dragState.nestedBoardIds.has(boardId);

  const placeholderStyles = useMemo(
    () =>
      placeholders.map((p) => {
        const pos = calcGridItemPosition(positionParams, p.x, p.y, p.w, p.h);

        return {
          i: p.i,
          style: {
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
          },
        };
      }),
    [placeholders, positionParams],
  );

  // Which board a drag belongs to. `registry.dragState` is one value shared by
  // every board under a `Board.Provider`, so `'drag'` has to narrow it to the
  // boards actually taking part: the source the widget came from, and the board
  // it is currently over (kept up to date by the registry as the drag crosses
  // boards). Without this, dragging on the root board lights up the grid inside
  // every nested container - noise on boards the widget cannot land in.
  const ownsDrag =
    !!dragState &&
    (dragState.sourceBoardId === boardId ||
      dragState.currentBoardId === boardId);

  // `placeholder` is this board's own drop-slot preview, so it covers the two
  // cases `dragState` does not: a resize (never a registry drag) and a board the
  // registry has just seeded a preview on.
  const gridLinesVisible =
    !hostWidgetIsDragging &&
    (effectiveShowGridLines === true ||
      (effectiveShowGridLines === 'drag' && (ownsDrag || !!placeholder)) ||
      (effectiveShowGridLines === 'any-drag' &&
        (!!dragState || !!placeholder)));
  const gridOverlayStyle = gridLinesVisible
    ? (() => {
        const colWidth = calcGridColWidth(positionParams);
        const rowHeightPx = positionParams.rowHeight;
        // A grid with margins has real gaps between cells, so any line-based
        // overlay either misses a cell edge (single line at the cell pitch) or
        // shows a double line in every gap (a line at both edges). Instead,
        // paint each snap cell as a faint block sized exactly `colWidth` x
        // `rowHeightPx` with the margin gaps left transparent: the blocks line
        // up 1:1 with the drop-zone placeholder and there are no lines to
        // double. Column stripes form the background; a row-band alpha mask
        // intersects them into cells.
        const pitchX = colWidth + effectiveMargin[0];
        const pitchY = rowHeightPx + effectiveMargin[1];
        // Position the overlay as an explicit rectangle inset by the board's
        // resolved padding and sized to exactly cover the grid content (cols x
        // rows). This makes the padding a symmetric frame on all four edges (the
        // previous `inset: 0` + top-left-anchored repeat left the padding
        // unvisualized on the right/bottom and inside any extra min-height) and
        // lets the cell pattern tile from the overlay's own origin.
        const padX = resolvedPadding[0];
        const padY = resolvedPadding[1];
        const gridWidth = Math.max(0, effectiveContainerWidth - padX * 2);
        // Painted over the reserved band too — grid cells are what make the
        // band read as board rather than as page background behind it.
        const gridHeight =
          renderedRows > 0
            ? renderedRows * rowHeightPx +
              (renderedRows - 1) * effectiveMargin[1]
            : 0;
        const fill = 'var(--border-color)';
        const columns = `repeating-linear-gradient(to right, ${fill} 0, ${fill} ${colWidth}px, transparent ${colWidth}px, transparent ${pitchX}px)`;
        const rowsGrad = `repeating-linear-gradient(to bottom, #000 0, #000 ${rowHeightPx}px, transparent ${rowHeightPx}px, transparent ${pitchY}px)`;
        return {
          left: `${padX}px`,
          top: `${padY}px`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          backgroundImage: columns,
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
          maskImage: rowsGrad,
          WebkitMaskImage: rowsGrad,
          maskPosition: '0 0',
          WebkitMaskPosition: '0 0',
          maskRepeat: 'repeat',
          WebkitMaskRepeat: 'repeat',
        };
      })()
    : null;

  // Metrics this board exposes to any aligned boards nested inside its widgets.
  const boardMetrics = useMemo<BoardMetrics>(
    () => ({
      colWidth: calcGridColWidth(positionParams),
      rowHeight: positionParams.rowHeight,
      margin: positionParams.margin,
      containerPadding: positionParams.containerPadding,
    }),
    [positionParams],
  );

  return (
    <BoardMetricsContext.Provider value={boardMetrics}>
      <BoardGridLinesContext.Provider
        value={
          effectiveShowGridLines === 'any-drag'
            ? 'any-drag'
            : effectiveShowGridLines
              ? 'drag'
              : false
        }
      >
        <BoardElement
          {...mergeProps(
            filterBaseProps(otherProps, { eventProps: true }),
            boardFocusWithinProps,
            { onKeyDown: handleBoardKeyDown },
          )}
          ref={containerRef}
          styles={styles}
          // A board that owns keys needs somewhere for focus to land after a
          // marquee or a delete, so Escape always reaches `handleBoardKeyDown`.
          tabIndex={selectionMode !== 'none' ? -1 : undefined}
          data-board-id={boardId}
          // Non-aligned: use min-height (not a fixed height) so the board
          // auto-sizes to its content by default but can still grow to fill a
          // taller parent. Widgets are absolutely positioned, so growing never
          // shifts them, and the content layer (inset: 0) always covers the full
          // board -> the whole board is droppable. Aligned: omit the inline height
          // so the board fills (and is bounded by) the space the container grants,
          // which is what drives the reduced row height.
          style={aligned ? undefined : { minHeight: `${containerHeight}px` }}
          mods={{
            dragging: !!dragState,
            'drop-target': dragState?.currentBoardId === boardId,
            marquee: isMarqueeActive,
          }}
        >
          <ContentLayer
            ref={contentRef}
            onPointerDown={handleContentPointerDown}
          >
            {ready && gridOverlayStyle ? (
              <GridOverlayElement aria-hidden="true" style={gridOverlayStyle} />
            ) : null}
            {ready
              ? layout.map((item) => {
                  const registration = registry.store.get(item.i);
                  const widgetDraggable =
                    isDraggable &&
                    (registration?.isDraggable ?? widgetProps?.isDraggable) !==
                      false &&
                    item.isDraggable !== false &&
                    !item.static;
                  const widgetResizable =
                    isResizable &&
                    (registration?.isResizable ?? widgetProps?.isResizable) !==
                      false &&
                    item.isResizable !== false &&
                    !item.static;
                  const handles =
                    item.resizeHandles ??
                    registration?.resizeHandles ??
                    widgetProps?.resizeHandles ??
                    resizeHandles;
                  const gripPlacement =
                    registration?.resizeGripPlacement ??
                    widgetProps?.resizeGripPlacement ??
                    resizeGripPlacement;
                  const widgetDragCancel =
                    registration?.dragCancel ??
                    widgetProps?.dragCancel ??
                    dragCancel;
                  const widgetDragHandle =
                    registration?.dragHandle ??
                    widgetProps?.dragHandle ??
                    dragHandle;
                  // Per-widget `isCard`/`styles` override the board-level
                  // `widgetProps` defaults; `isCard` defaults to `false`
                  // (borderless - widgets are always filled and rounded).
                  const widgetIsCard =
                    registration?.isCard ?? widgetProps?.isCard ?? false;
                  // Per-widget `isAutoHeight`/`qa` fall back to the board-level
                  // `widgetProps` defaults (mirroring the other widget props).
                  const widgetIsAutoHeight =
                    registration?.isAutoHeight ??
                    widgetProps?.isAutoHeight ??
                    false;
                  const widgetQa = registration?.qa ?? widgetProps?.qa;
                  const widgetSelectable =
                    selectionMode !== 'none' && isWidgetSelectable(item.i);
                  const widgetSelectionCancel =
                    registration?.selectionCancel ??
                    widgetProps?.selectionCancel ??
                    selectionCancel;
                  // Merge board-level `widgetProps` styles (its `styles` object
                  // plus direct style props) with the per-widget styles so
                  // shared defaults survive when a widget sets even a single
                  // style prop; per-widget styles win on conflicts. Only merge
                  // when both exist to preserve reference stability (and avoid
                  // churn) in the common single-source case.
                  const widgetStyles =
                    registration?.styles && widgetPropsStyles
                      ? mergeStyles(widgetPropsStyles, registration.styles)
                      : registration?.styles ?? widgetPropsStyles;

                  return (
                    <WidgetHost
                      key={item.i}
                      boardId={boardId}
                      item={item}
                      positionParams={positionParams}
                      registration={registration}
                      isCard={widgetIsCard}
                      styles={widgetStyles as Styles}
                      isDraggable={widgetDraggable}
                      isResizable={widgetResizable}
                      resizeHandles={handles}
                      resizeGripPlacement={gripPlacement}
                      isAutoHeight={widgetIsAutoHeight}
                      qa={widgetQa}
                      dragCancel={widgetDragCancel}
                      dragHandle={widgetDragHandle}
                      isSelectable={widgetSelectable}
                      isSelected={selectedKeySet.has(item.i)}
                      isPreSelected={preSelectedKeys.has(item.i)}
                      selectionCancel={widgetSelectionCancel}
                      selectedHintId={selectedHintId}
                      onSelect={select}
                      onSelectionReset={clearSelection}
                      selectModifierKey={selectModifierKey}
                      registry={registry}
                      dragState={dragState}
                      settled={settled}
                      onResize={handleResize}
                      onAutoHeight={handleAutoHeight}
                      onDragLifecycle={handleDragLifecycle}
                    />
                  );
                })
              : null}
            {placeholderStyles.map(({ i, style }) => (
              <PlaceholderElement key={i} aria-hidden="true" style={style} />
            ))}
            {marqueeStyle ? (
              <MarqueeElement aria-hidden="true" style={marqueeStyle} />
            ) : null}
          </ContentLayer>
          {selectionMode !== 'none' ? (
            <A11yLayer>
              <span id={selectedHintId}>{t('board.selected', 'Selected')}</span>
              <span role="status" aria-live="polite" aria-atomic="true">
                {announcement}
              </span>
            </A11yLayer>
          ) : null}
          {children}
        </BoardElement>
      </BoardGridLinesContext.Provider>
    </BoardMetricsContext.Provider>
  );
}

const BoardInnerForwarded = forwardRef(BoardInner);

/**
 * A draggable and resizable widget grid. Widgets are declared with
 * `Board.Widget` and positioned via a `layout`. Wrap multiple boards in a
 * `BoardProvider` to enable dragging widgets between them.
 */
export const Board = forwardRef(function Board(
  props: CubeBoardProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const existingRegistry = useBoardRegistry();

  if (existingRegistry) {
    return <BoardInnerForwarded {...props} ref={ref} />;
  }

  return (
    <BoardProvider>
      <BoardInnerForwarded {...props} ref={ref} />
    </BoardProvider>
  );
});
