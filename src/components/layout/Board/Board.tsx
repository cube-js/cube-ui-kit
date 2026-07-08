import { useResizeObserver } from '@react-aria/utils';
import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
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

import { BoardEntry, useBoardRegistry } from './board-context';
import { BoardProvider } from './BoardProvider';
import {
  applySizeConstraints,
  bottom,
  calcGridItemPosition,
  calcWH,
  Compactor,
  CompactType,
  defaultConstraints,
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

const BoardElement = tasty({
  qa: 'Board',
  styles: {
    position: 'relative',
    display: 'block',
    width: '100%',
    fill: '#clear',
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
    transition: 'transform 80ms linear, width 80ms linear, height 80ms linear',
    boxSizing: 'border-box',
  },
});

export type BoardCompactType = 'vertical' | 'horizontal' | 'free' | null;

export interface CubeBoardProps
  extends Omit<AllBaseProps, 'children'>,
    Omit<ContainerStyleProps, 'margin'> {
  /** Stable board id (used for cross-board drag). Auto-generated if omitted. */
  id?: string;
  /** Controlled layout. */
  layout?: LayoutItem[];
  /** Initial layout for uncontrolled usage. */
  defaultLayout?: LayoutItem[];
  onLayoutChange?: (layout: LayoutItem[]) => void;
  /** Number of columns. @default 12 */
  cols?: number;
  /** Row height in pixels. @default 100 */
  rowHeight?: number;
  /** [horizontal, vertical] margin between widgets in pixels. @default [8, 8] */
  margin?: [number, number];
  /** [horizontal, vertical] padding inside the board. Defaults to `margin`. */
  containerPadding?: [number, number];
  /** Maximum number of rows. @default Infinity */
  maxRows?: number;
  /** Compaction behavior. @default 'vertical' */
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
  /** Grid/item layout constraints. */
  constraints?: LayoutConstraint[];
  /**
   * Explicit container width in pixels. When provided, disables automatic width
   * measurement (useful for SSR and tests).
   */
  width?: number;
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
    constraints,
    width: providedWidth,
    children,
    ...otherProps
  } = props;

  const registry = useBoardRegistry()!;
  const generatedId = useId();
  const boardId = providedId ?? generatedId;

  const containerRef = useCombinedRefs(ref);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const width = providedWidth ?? measuredWidth;

  const onResizeContainer = useEvent(() => {
    const el = containerRef.current;
    if (el) {
      setMeasuredWidth(el.offsetWidth);
    }
  });
  useResizeObserver({ ref: containerRef, onResize: onResizeContainer });
  useEffect(() => {
    if (providedWidth == null) {
      onResizeContainer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedWidth]);

  const { layout, layoutRef, placeholder, setPlaceholder, applyLayout } =
    useBoardLayout({
      layout: controlledLayout,
      defaultLayout,
      onLayoutChange,
    });

  // Re-render when any widget's registered content/config changes.
  useSyncExternalStore(registry.store.subscribe, registry.store.getVersion);

  const resolvedPadding = containerPadding ?? margin;

  const positionParams = useMemo<PositionParams>(
    () => ({
      margin,
      containerPadding: resolvedPadding,
      containerWidth: width,
      cols,
      rowHeight,
      maxRows,
    }),
    [
      margin[0],
      margin[1],
      resolvedPadding[0],
      resolvedPadding[1],
      width,
      cols,
      rowHeight,
      maxRows,
    ],
  );

  const compactor = useMemo<Compactor>(() => {
    // 'free' means true free positioning: widgets can overlap and nothing is
    // pushed or recompacted. Force allowOverlap so `moveElement` short-circuits
    // on collision and the (no-op) compactor leaves items exactly where dropped.
    if (compact === 'free') {
      return getCompactor(null, true, preventCollision);
    }
    return getCompactor(
      compactTypeToCore(compact),
      allowOverlap,
      preventCollision,
    );
  }, [compact, allowOverlap, preventCollision]);

  const resolvedConstraints = constraints ?? defaultConstraints;

  const rows = Math.max(
    bottom(layout),
    placeholder ? placeholder.y + placeholder.h : 0,
  );
  const containerHeight =
    rows > 0
      ? rows * rowHeight +
        Math.max(0, rows - 1) * margin[1] +
        resolvedPadding[1] * 2
      : rowHeight;

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

  // In-board resize orchestration.
  const resizeStateRef = useRef<{
    id: string;
    axis: ResizeHandleAxis;
    item: LayoutItem;
    origin: Position;
    accX: number;
    accY: number;
  } | null>(null);

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
        // Layout-item constraints win; otherwise fall back to the ones declared
        // on the owning `Board.Widget` so `applySizeConstraints` picks them up.
        const item: LayoutItem = {
          ...rawItem,
          constraints:
            rawItem.constraints ?? registry.store.get(id)?.constraints,
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
        return;
      }

      const rs = resizeStateRef.current;
      if (!rs) return;

      if (phase === 'end') {
        applyLayout([...layoutRef.current], true);
        setPlaceholder(null);
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

      let x = item.x;
      let y = item.y;
      if (handle.includes('w')) x = item.x + item.w - constrained.w;
      if (handle.includes('n')) y = item.y + item.h - constrained.h;
      x = Math.max(0, x);
      y = Math.max(0, y);

      const newItem: LayoutItem = {
        ...item,
        x,
        y,
        w: constrained.w,
        h: constrained.h,
      };
      const working = modifyLayout(layoutRef.current, newItem);
      const compacted = [
        ...liveRef.current.compactor.compact(working, pp.cols),
      ];
      applyLayout(compacted, false);
      setPlaceholder(getLayoutItem(compacted, id) ?? newItem);
    },
  );

  const styles: Styles = extractStyles(otherProps, CONTAINER_STYLES);

  const dragState = registry.dragState;
  const ready = width > 0;

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
          transform: `translate(${pos.left}px, ${pos.top}px)`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
        };
      })()
    : null;

  const showPlaceholder = placeholder && placeholderStyle;

  return (
    <BoardElement
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={containerRef}
      styles={styles}
      // Use min-height (not a fixed height) so the board auto-sizes to its
      // content by default but can still grow to fill a taller parent (e.g. a
      // nested board stretched inside a container widget). Widgets are absolutely
      // positioned, so growing never shifts them, and the content layer
      // (inset: 0) always covers the full board -> the whole board is droppable.
      style={{ minHeight: `${containerHeight}px` }}
      mods={{
        dragging: !!dragState,
        'drop-target': dragState?.currentBoardId === boardId,
      }}
    >
      <ContentLayer ref={contentRef}>
        {ready
          ? layout.map((item) => {
              const registration = registry.store.get(item.i);
              const widgetDraggable =
                isDraggable &&
                registration?.isDraggable !== false &&
                item.isDraggable !== false &&
                !item.static;
              const widgetResizable =
                isResizable &&
                registration?.isResizable !== false &&
                item.isResizable !== false &&
                !item.static;
              const handles =
                item.resizeHandles ??
                registration?.resizeHandles ??
                resizeHandles;

              return (
                <WidgetHost
                  key={item.i}
                  boardId={boardId}
                  item={item}
                  positionParams={positionParams}
                  registration={registration}
                  isDraggable={widgetDraggable}
                  isResizable={widgetResizable}
                  resizeHandles={handles}
                  registry={registry}
                  dragState={dragState}
                  onResize={handleResize}
                />
              );
            })
          : null}
        {showPlaceholder ? (
          <PlaceholderElement aria-hidden="true" style={placeholderStyle!} />
        ) : null}
      </ContentLayer>
      {children}
    </BoardElement>
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
