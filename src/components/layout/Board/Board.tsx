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

import { useEvent } from '../../../_internal/hooks';
import { useCombinedRefs } from '../../../utils/react';
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
import { ResizePhase, WidgetHost } from './WidgetHost';

import type { CubeBoardWidgetProps } from './Widget';

const BoardElement = tasty({
  qa: 'Board',
  styles: {
    position: 'relative',
    display: 'block',
    width: '100%',
    flexGrow: 1,
    minHeight: '0',
    fill: '#surface',
    boxSizing: 'border-box',
  },
});

const ContentLayer = tasty({
  styles: {
    position: 'absolute',
    inset: 0,
  },
});

const PlaceholderElement = tasty({
  qa: 'BoardPlaceholder',
  styles: {
    position: 'absolute',
    top: 0,
    left: 0,
    fill: '#purple.10',
    radius: '1cr',
    border: '#purple.40',
    zIndex: 2,
    pointerEvents: 'none',
    transition: 'inset 80ms linear, width 80ms linear, height 80ms linear',
    boxSizing: 'border-box',
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
 */
export interface BoardInteractionInfo {
  layout: LayoutItem[];
  item: LayoutItem;
  oldItem: LayoutItem;
  placeholder: LayoutItem | null;
}

/** Visibility of the internal grid-line overlay. */
export type BoardGridLines = boolean | 'drag';

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
  /** Enable dragging for all widgets. @default true */
  isDraggable?: boolean;
  /** Enable resizing for all widgets. @default true */
  isResizable?: boolean;
  /** Whether this board accepts widgets dropped from other boards. @default true */
  isDroppable?: boolean;
  /** Which resize handles to show. @default ['se'] */
  resizeHandles?: ResizeHandleAxis[];
  /**
   * CSS selector for elements that must not start a pointer drag (e.g. form
   * controls inside a widget: `"input,textarea,button,a,.no-drag"`). Keyboard
   * moves are unaffected. Can be overridden per widget on `Board.Widget`.
   */
  dragCancel?: string;
  /**
   * CSS selector for the only elements from which a pointer drag may start.
   * Can be overridden per widget on `Board.Widget`.
   */
  dragHandle?: string;
  /**
   * Show grid lines behind the widgets. `true` always shows them, `'drag'`
   * shows them only while a widget is being dragged or resized, `false` never.
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
    compact = 'vertical',
    allowOverlap = false,
    preventCollision = false,
    isDraggable = true,
    isResizable = true,
    isDroppable = true,
    resizeHandles = ['se'],
    dragCancel,
    dragHandle,
    showGridLines,
    isAligned = false,
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
  // when the ancestor has grid lines enabled, show them here while dragging.
  const effectiveShowGridLines: BoardGridLines =
    showGridLines ?? (inheritedGridLines ? 'drag' : false);
  const generatedId = useId();
  const boardId = providedId ?? generatedId;

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
    placeholder,
    placeholderRef,
    setPlaceholder,
    applyLayout,
  } = useBoardLayout({
    layout: controlledLayout,
    defaultLayout,
    onLayoutChange,
  });

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
    placeholder ? placeholder.y + placeholder.h : 0,
  );

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
    rows > 0
      ? rows * effectiveRowHeight +
        Math.max(0, rows - 1) * effectiveMargin[1] +
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
    constraints: resolvedConstraints,
    maxRows,
    containerHeight,
    isDroppable,
  });
  liveRef.current = {
    positionParams,
    compactor,
    constraints: resolvedConstraints,
    maxRows,
    containerHeight,
    isDroppable,
  };

  const applyLayoutEvent = useEvent(applyLayout);
  const setPlaceholderEvent = useEvent(setPlaceholder);

  const entryRef = useRef<BoardEntry | null>(null);
  if (!entryRef.current) {
    entryRef.current = {
      id: boardId,
      getContentRect: () => contentRef.current?.getBoundingClientRect() ?? null,
      getContentNode: () => contentRef.current,
      getPositionParams: () => liveRef.current.positionParams,
      getConstraints: () => liveRef.current.constraints,
      getCompactor: () => liveRef.current.compactor,
      getMaxRows: () => liveRef.current.maxRows,
      getContainerHeight: () => liveRef.current.containerHeight,
      getLayout: () => layoutRef.current,
      applyLayout: (next, commit) => applyLayoutEvent(next, commit),
      setPlaceholder: (item) => setPlaceholderEvent(item),
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
    rows > 0
      ? rows * effectiveRowHeight +
        Math.max(0, rows - 1) * effectiveMargin[1] +
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
        setPlaceholder({ ...item });
        onResizeStart?.({
          layout: layoutRef.current,
          item: { ...item },
          oldItem: { ...item },
          placeholder: { ...item },
        });
        return;
      }

      const rs = resizeStateRef.current;
      if (!rs) return;

      if (phase === 'end') {
        const finalLayout = [...layoutRef.current];
        applyLayout(finalLayout, true);
        setPlaceholder(null);
        onResizeStop?.({
          layout: finalLayout,
          item: getLayoutItem(finalLayout, id) ?? rs.item,
          oldItem: rs.item,
          placeholder: null,
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
      setPlaceholder(nextPlaceholder);
      onResizeProp?.({
        layout: compacted,
        item: getLayoutItem(compacted, id) ?? newItem,
        oldItem: rs.item,
        placeholder: nextPlaceholder,
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

  const handleDragLifecycle = useEvent((id: string, phase: ResizePhase) => {
    const currentLayout = layoutRef.current;
    const liveItem = getLayoutItem(currentLayout, id);

    if (phase === 'start') {
      dragOldItemRef.current = liveItem ? { ...liveItem } : null;
    }
    const oldItem = dragOldItemRef.current ?? liveItem;
    if (!oldItem) return;
    const item = liveItem ?? oldItem;

    const info: BoardInteractionInfo = {
      layout: currentLayout,
      item,
      oldItem,
      // Read the live ref, not render-time state: the registry calls
      // `setPlaceholder` synchronously right before this fires, and that only
      // schedules a re-render, so `placeholder` state still holds the previous
      // value (or a stale preview after the drop clears it to `null`).
      placeholder: placeholderRef.current,
    };
    if (phase === 'start') onDragStart?.(info);
    else if (phase === 'move') onDrag?.(info);
    else {
      onDragStop?.(info);
      dragOldItemRef.current = null;
    }
  });

  const styles: Styles = extractStyles(otherProps, CONTAINER_STYLES);

  const dragState = registry.dragState;
  const ready = width > 0;

  // When the widget that hosts this nested board is the one being dragged, its
  // whole content (including this board) floats as a single unit, so its own
  // grid lines add nothing but clutter. Suppress them for that drag.
  const hostWidgetIsDragging =
    !!dragState && dragState.nestedBoardIds.has(boardId);

  const placeholderStyle = placeholder
    ? (() => {
        const pos = calcGridItemPosition(
          positionParams,
          placeholder.x,
          placeholder.y,
          placeholder.w,
          placeholder.h,
        );
        return {
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
        };
      })()
    : null;

  const showPlaceholder = placeholder && placeholderStyle;

  const gridLinesVisible =
    !hostWidgetIsDragging &&
    (effectiveShowGridLines === true ||
      (effectiveShowGridLines === 'drag' && (!!dragState || !!placeholder)));
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
        const gridHeight =
          rows > 0 ? rows * rowHeightPx + (rows - 1) * effectiveMargin[1] : 0;
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
          effectiveShowGridLines === true || effectiveShowGridLines === 'drag'
        }
      >
        <BoardElement
          {...filterBaseProps(otherProps, { eventProps: true })}
          ref={containerRef}
          styles={styles}
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
          }}
        >
          <ContentLayer ref={contentRef}>
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
                      dragCancel={widgetDragCancel}
                      dragHandle={widgetDragHandle}
                      registry={registry}
                      dragState={dragState}
                      onResize={handleResize}
                      onAutoHeight={handleAutoHeight}
                      onDragLifecycle={handleDragLifecycle}
                    />
                  );
                })
              : null}
            {showPlaceholder ? (
              <PlaceholderElement
                aria-hidden="true"
                style={placeholderStyle!}
              />
            ) : null}
          </ContentLayer>
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
