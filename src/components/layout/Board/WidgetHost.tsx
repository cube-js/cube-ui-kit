import { Styles, tasty } from '@tenphi/tasty';
import { CSSProperties, useMemo, useRef, useState } from 'react';
import { useFocusRing, useFocusWithin, useHover, useMove } from 'react-aria';
import { createPortal } from 'react-dom';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps } from '../../../utils/react';

import {
  BoardDragState,
  BoardHost,
  BoardHostContext,
  BoardRegistryContextValue,
  ViewportRect,
} from './board-context';
import { WidgetRegistration } from './board-store';
import {
  calcGridColWidth,
  calcGridItemPosition,
  LayoutItem,
  PositionParams,
  ResizeHandleAxis,
} from './grid-core';

export type ResizePhase = 'start' | 'move' | 'end';

/**
 * Slack (px) absorbed when converting an auto-height widget's content height to
 * whole rows, so sub-pixel measurement/rounding noise never bumps an extra row.
 */
const AUTO_HEIGHT_TOLERANCE = 4;

const WidgetElement = tasty({
  qa: 'BoardWidget',
  styles: {
    position: 'absolute',
    top: 0,
    left: 0,
    // Widgets always carry a `#surface-2` fill and rounded corners. The `card`
    // modifier (board-level `widgetProps.isCard` or per-widget `isCard`) adds a
    // border on top; a non-card widget is borderless so nested boards can align
    // their columns flush with the parent grid.
    fill: '#surface-2',
    radius: '1cr',
    border: {
      '': false,
      card: true,
    },
    shadow: {
      '': false,
      'hovered & !card & (draggable | resizing)': '0 0 0 1bw #border',
      // `$dialog-shadow` uses Glaze `#shadow-lg`, which adapts to dark / high-contrast schemes.
      'drag | resizing': '$dialog-shadow',
    },
    outline: {
      '': '1bw #primary-text.0',
      'focus-visible': '1bw #primary-text',
    },
    outlineOffset: '1bw',
    zIndex: {
      '': 1,
      'drag | resizing': 10,
    },
    // The pointer-drag ghost (the clone that floats in the overlay) is slightly
    // translucent so the user can see through it to whatever it hovers over -
    // e.g. a Tabs header underneath - and land a precise drop / tab switch. The
    // in-place host (keyboard drags, which never float) stays fully opaque.
    opacity: {
      '': 1,
      floating: 0.8,
    },
    // Reflowing widgets animate their position and size. The actively
    // dragged/resized element - and the floating overlay clone - must track the
    // pointer with no lag, so they drop geometry from the list. Geometry is also
    // dropped until the board reports `settled`: on init widgets jump to their
    // first measured positions, and without this gate they would slide/grow in
    // from their default box. The board lifts the gate after the first
    // positioned paint so subsequent reflows animate normally.
    transition: {
      '': 'theme, shadow, opacity',
      settled: 'theme, shadow, opacity, inset, width, height',
      'drag | floating | resizing': 'theme, shadow, opacity',
    },
    boxSizing: 'border-box',
    userSelect: {
      '': 'auto',
      'drag | resizing': 'none',
    },
    cursor: {
      '': 'auto',
      draggable: 'grab',
      drag: 'grabbing',
    },
    touchAction: 'none',
    overflow: 'hidden',
  },
});

const HandleElement = tasty({
  qa: 'BoardResizeHandle',
  styles: {
    position: 'absolute',
    zIndex: 20,
    fill: '#clear',
    // Overhang: how far the hit-zone extends beyond the widget edge.
    '--handle-size': '24px',
    '--handle-overhang': '-8px',
    '--handle-inset': '8px',
    width: {
      '': '$handle-size',
      '[data-axis="n"] | [data-axis="s"]': 'auto',
    },
    height: {
      '': '$handle-size',
      '[data-axis="e"] | [data-axis="w"]': 'auto',
    },
    top: {
      '': 'auto',
      '[data-axis="n"] | [data-axis="ne"] | [data-axis="nw"]':
        '$handle-overhang',
      '[data-axis="e"] | [data-axis="w"]': '$handle-inset',
    },
    bottom: {
      '': 'auto',
      '[data-axis="s"] | [data-axis="se"] | [data-axis="sw"]':
        '$handle-overhang',
      '[data-axis="e"] | [data-axis="w"]': '$handle-inset',
    },
    left: {
      '': 'auto',
      '[data-axis="w"] | [data-axis="nw"] | [data-axis="sw"]':
        '$handle-overhang',
      '[data-axis="n"] | [data-axis="s"]': '$handle-inset',
    },
    right: {
      '': 'auto',
      '[data-axis="e"] | [data-axis="ne"] | [data-axis="se"]':
        '$handle-overhang',
      '[data-axis="n"] | [data-axis="s"]': '$handle-inset',
    },
    cursor: {
      '': 'default',
      '[data-axis="n"] | [data-axis="s"]': 'ns-resize',
      '[data-axis="e"] | [data-axis="w"]': 'ew-resize',
      '[data-axis="ne"] | [data-axis="sw"]': 'nesw-resize',
      '[data-axis="nw"] | [data-axis="se"]': 'nwse-resize',
    },
    touchAction: 'none',
  },
});

const GripElement = tasty({
  qa: 'BoardResizeGrip',
  styles: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      revealed: 1,
    },
    transition: 'opacity 120ms ease-in-out',
    borderTop: {
      '': '0',
      '[data-axis="ne"] | [data-axis="nw"]': '2px solid #dark.40',
    },
    borderBottom: {
      '': '0',
      '[data-axis="se"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderLeft: {
      '': '0',
      '[data-axis="nw"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderRight: {
      '': '0',
      '[data-axis="ne"] | [data-axis="se"]': '2px solid #dark.40',
    },
    radius: {
      '': '0',
      '[data-axis="se"]': '0 0 4px 0',
      '[data-axis="sw"]': '0 0 0 4px',
      '[data-axis="ne"]': '0 4px 0 0',
      '[data-axis="nw"]': '4px 0 0 0',
    },
    top: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="nw"]': '4px',
    },
    bottom: {
      '': 'auto',
      '[data-axis="se"] | [data-axis="sw"]': '4px',
    },
    left: {
      '': 'auto',
      '[data-axis="nw"] | [data-axis="sw"]': '4px',
    },
    right: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="se"]': '4px',
    },
  },
});

// Edge axes (n/s/e/w) get a dotted grip affordance, revealed on
// hover/focus/resize. The dots line up along the edge (a vertical column for the
// e/w handles, a horizontal row for n/s), matching the design-system pane grip
// (see `Layout.Pane`). Purely visual - the interaction still lives on the
// transparent `HandleElement` hit-zone above.
const EdgeGripElement = tasty({
  qa: 'BoardResizeEdgeGrip',
  styles: {
    position: 'absolute',
    display: 'grid',
    gap: '2bw',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      revealed: 1,
    },
    transition: 'opacity 120ms ease-in-out',
    // A column of 5 dots for the vertical edges (e/w), a row of 5 for n/s.
    gridColumns: {
      '': '3px',
      '[data-axis="n"] | [data-axis="s"]': '3px 3px 3px 3px 3px',
    },
    gridRows: {
      '': '3px 3px 3px 3px 3px',
      '[data-axis="n"] | [data-axis="s"]': '3px',
    },
    // Anchor to the relevant edge and center along it.
    top: {
      '': '50%',
      '[data-axis="n"]': '3px',
      '[data-axis="s"]': 'auto',
    },
    bottom: {
      '': 'auto',
      '[data-axis="s"]': '3px',
    },
    left: {
      '': 'auto',
      '[data-axis="w"]': '3px',
      '[data-axis="n"] | [data-axis="s"]': '50%',
    },
    right: {
      '': 'auto',
      '[data-axis="e"]': '3px',
    },
    transform: {
      '': 'translate(0, 0)',
      '[data-axis="e"] | [data-axis="w"]': 'translate(0, -50%)',
      '[data-axis="n"] | [data-axis="s"]': 'translate(-50%, 0)',
    },

    Dot: {
      width: '3px',
      height: '3px',
      radius: 'round',
      fill: {
        '': '#dark-03',
        resizing: '#dark-02',
      },
    },
  },
});

/** Corner axes get a visible grip affordance on hover/focus/resize. */
function isCornerAxis(axis: ResizeHandleAxis): boolean {
  return axis.length === 2;
}

/** Edge axes (n/s/e/w) get a dotted grip affordance. */
function isEdgeAxis(axis: ResizeHandleAxis): boolean {
  return axis.length === 1;
}

interface ResizeHandleProps {
  axis: ResizeHandleAxis;
  onResize: (
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => void;
}

function ResizeHandle({ axis, onResize }: ResizeHandleProps) {
  const { moveProps } = useMove({
    onMoveStart() {
      onResize(axis, 'start', 0, 0);
    },
    onMove(e) {
      onResize(axis, 'move', e.deltaX, e.deltaY);
    },
    onMoveEnd() {
      onResize(axis, 'end', 0, 0);
    },
  });

  const stopProps = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
  };

  return (
    <HandleElement
      data-axis={axis}
      {...mergeProps(stopProps, moveProps)}
      aria-hidden="true"
    />
  );
}

export interface WidgetHostProps {
  boardId: string;
  item: LayoutItem;
  positionParams: PositionParams;
  registration: WidgetRegistration | undefined;
  /**
   * Whether this widget renders with card chrome (fill/border/radius). Resolved
   * by the owning `Board` from the per-widget `isCard` and the board-level
   * `widgetProps.isCard` default.
   */
  isCard: boolean;
  /**
   * Resolved style overrides for the rendered widget element (per-widget
   * `styles` falling back to the board-level `widgetProps.styles`).
   */
  styles?: Styles;
  isDraggable: boolean;
  isResizable: boolean;
  resizeHandles: ResizeHandleAxis[];
  /**
   * Whether this widget grows to fit its content. Resolved by the owning
   * `Board` from the per-widget `isAutoHeight` and the board-level
   * `widgetProps.isAutoHeight` default.
   */
  isAutoHeight: boolean;
  /**
   * Test id / accessible name for the rendered widget element. Resolved by the
   * owning `Board` from the per-widget `qa` and the board-level `widgetProps.qa`
   * default; falls back to the layout id.
   */
  qa?: string;
  /**
   * CSS selector for elements that must not start a pointer drag (e.g. form
   * controls inside the widget). A pointer-down whose target matches this
   * selector never begins a drag.
   */
  dragCancel?: string;
  /**
   * CSS selector for the only elements from which a pointer drag may start. A
   * pointer-down outside a matching element never begins a drag.
   */
  dragHandle?: string;
  /**
   * Whether the owning board has settled its widgets' initial positions. While
   * false, the widget does not animate `inset` (left/top) so the first
   * positioned paint isn't seen as a transition. Lifted after the board's first
   * measured render.
   */
  settled?: boolean;
  registry: BoardRegistryContextValue;
  dragState: BoardDragState | null;
  onResize: (
    id: string,
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => void;
  /**
   * Report the minimum number of rows this widget needs to fit its content
   * (typically a nested board). The owning board grows the item to this height
   * when it is taller than the current one, and treats it as the resize floor
   * so the widget cannot be dragged shorter than its content requires.
   */
  onAutoHeight: (id: string, neededRows: number) => void;
  /**
   * Notify the owning board of a drag gesture's lifecycle so it can emit the
   * public drag callbacks. Fires after the registry has updated drag state.
   */
  onDragLifecycle?: (id: string, phase: ResizePhase) => void;
}

/**
 * The positioned, interactive wrapper a board renders for each layout item it
 * owns. Content is pulled from the shared store (by id), so any board can host
 * any widget. Dragging uses React Aria `useMove`; during a drag the widget
 * renders into the shared overlay portal so it can float outside its board.
 */
export function WidgetHost(props: WidgetHostProps) {
  const {
    boardId,
    item,
    positionParams,
    registration,
    isCard,
    styles: widgetStyles,
    isDraggable,
    isResizable,
    resizeHandles,
    isAutoHeight,
    qa,
    dragCancel,
    dragHandle,
    registry,
    dragState,
    settled,
    onResize,
    onAutoHeight,
    onDragLifecycle,
  } = props;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const isActiveDrag = dragState?.itemId === item.i;

  // Translate a nested board's reported height deficit (signed px: positive when
  // it is squeezed, negative when it has slack) into the absolute number of rows
  // this widget needs, and report it to the owning board. The widget's chrome
  // cancels out: the needed pixel height is the widget's current pixel height
  // plus the deficit. A small tolerance keeps sub-pixel rounding from bumping an
  // extra row. Skipped during a drag (the widget is floating in the overlay).
  const requestHeightDeficit = useEvent((deficitPx: number) => {
    if (!isAutoHeight || isActiveDrag) return;
    const step = positionParams.rowHeight + positionParams.margin[1];
    if (step <= 0) return;
    const current = calcGridItemPosition(
      positionParams,
      item.x,
      item.y,
      item.w,
      item.h,
    );
    const neededPx = current.height + deficitPx;
    const neededRows = Math.max(
      1,
      Math.ceil(
        (neededPx + positionParams.margin[1] - AUTO_HEIGHT_TOLERANCE) / step,
      ),
    );
    onAutoHeight(item.i, neededRows);
  });

  const hostValue = useMemo<BoardHost>(
    () => ({ isAutoHeight, requestHeightDeficit }),
    [isAutoHeight, requestHeightDeficit],
  );
  // Keyboard drags stay in place: moving the focused element into the overlay
  // portal would unmount it and stop arrow-key move events.
  const useOverlay = isActiveDrag && dragState?.pointerType !== 'keyboard';

  const [isResizing, setIsResizing] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { hoverProps, isHovered } = useHover({ isDisabled: isActiveDrag });
  const { focusProps, isFocusVisible } = useFocusRing();
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  // Reveal the resize grips when the widget is interacted with (but not while it
  // is being dragged, where the widget floats in the overlay).
  const gripsRevealed =
    isResizable &&
    !item.static &&
    !isActiveDrag &&
    (isHovered || isFocusWithin || isResizing);

  const { moveProps } = useMove({
    onMoveStart(e) {
      if (!isDraggable) return;
      const rect = hostRef.current?.getBoundingClientRect();
      const pos = calcGridItemPosition(
        positionParams,
        item.x,
        item.y,
        item.w,
        item.h,
      );
      const vr: ViewportRect = rect
        ? {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }
        : {
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
          };
      registry.onDragStart(boardId, item.i, vr, e.pointerType, hostRef.current);
      onDragLifecycle?.(item.i, 'start');
    },
    onMove(e) {
      if (!isDraggable) return;
      if (e.pointerType === 'keyboard') {
        // Amplify arrow-key steps to a full grid cell so items actually move.
        const colWidth = calcGridColWidth(positionParams);
        const stepX = colWidth + positionParams.margin[0];
        const stepY = positionParams.rowHeight + positionParams.margin[1];
        registry.onDragMove(
          Math.sign(e.deltaX) * stepX,
          Math.sign(e.deltaY) * stepY,
          e.pointerType,
        );
        onDragLifecycle?.(item.i, 'move');
        return;
      }
      registry.onDragMove(e.deltaX, e.deltaY, e.pointerType);
      onDragLifecycle?.(item.i, 'move');
    },
    onMoveEnd() {
      if (!isDraggable) return;
      registry.onDragEnd();
      onDragLifecycle?.(item.i, 'end');
    },
  });

  const a11yProps = {
    tabIndex: isDraggable ? 0 : undefined,
    'aria-roledescription': isDraggable ? 'Draggable widget' : undefined,
    'aria-label': qa ?? item.i,
  };

  // When this widget is draggable it owns its gesture, so stop the pointer-down
  // from bubbling to an ancestor widget host (e.g. a container widget hosting a
  // nested board / Tabs). Otherwise the ancestor's `useMove` would start a
  // second drag from the same press and the whole parent widget would move too.
  // Non-draggable widgets let the event bubble so their container stays grabbable
  // through their content.
  const stopBubbleProps = isDraggable
    ? {
        onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
      }
    : {};

  // Gate a pointer drag by `dragHandle` / `dragCancel` selectors. Returns true
  // when the press must NOT start a drag (outside a `dragHandle`, or matching
  // `dragCancel`).
  const shouldGateDrag = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (dragHandle && !target.closest(dragHandle)) return true;
    return !!(dragCancel && target.closest(dragCancel));
  };

  // The gate wraps `useMove`'s own pointer-down handlers rather than a separate
  // capture-phase listener. When a press is gated we simply do not forward it to
  // `useMove`, so the drag never begins. This is deliberate: `useMove`'s
  // pointer-down handler calls both `stopPropagation()` and `preventDefault()`.
  // Calling it (or pre-empting it with a capture-phase `stopPropagation()`)
  // would break the very controls `dragCancel` is meant to protect - a
  // `preventDefault()` on pointer-down cancels a native `<input>`'s focus, and a
  // capture-phase `stopPropagation()` swallows a `<button>`'s own press events.
  // Skipping `useMove` entirely leaves the target's default behavior and its own
  // handlers fully intact.
  //
  // Keyboard moves also go through `useMove` (`onKeyDown`). Arrow keys must only
  // move the widget when the host itself is focused — not when focus is inside a
  // nested input, textarea, or other descendant (those events bubble to the host
  // and would otherwise steal caret / list navigation).
  //
  // A non-draggable widget must not carry `moveProps` at all: `useMove`'s
  // pointer-down handler calls `preventDefault()`, which cancels native text
  // selection inside the widget. Read-only boards (`isDraggable={false}`) still
  // need selectable content, so we drop the handlers entirely instead of relying
  // on the early-returns inside the `onMove*` callbacks.
  const gatedMoveProps = !isDraggable
    ? {}
    : {
        ...moveProps,
        ...(moveProps.onPointerDown && {
          onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            hostRef.current?.focus({ preventScroll: true });
            moveProps.onPointerDown!(e);
          },
        }),
        ...(moveProps.onMouseDown && {
          onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            hostRef.current?.focus({ preventScroll: true });
            moveProps.onMouseDown!(e);
          },
        }),
        ...(moveProps.onTouchStart && {
          onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            moveProps.onTouchStart!(e);
          },
        }),
        ...(moveProps.onKeyDown && {
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.target !== e.currentTarget) return;
            moveProps.onKeyDown!(e);
          },
        }),
      };

  const handleResize = (
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => {
    if (phase === 'start') setIsResizing(true);
    else if (phase === 'end') setIsResizing(false);
    onResize(item.i, axis, phase, dx, dy);
  };

  const mods = {
    drag: isActiveDrag,
    draggable: isDraggable && !isActiveDrag,
    static: !!item.static,
    resizing: isResizing,
    card: isCard,
    hovered: isHovered,
    'focus-visible': isFocusVisible,
  };

  const content = (
    <BoardHostContext.Provider value={hostValue}>
      {registration?.content}
      {isResizable && !item.static ? (
        <>
          {resizeHandles.map((axis) => (
            <ResizeHandle key={axis} axis={axis} onResize={handleResize} />
          ))}
          {resizeHandles.filter(isCornerAxis).map((axis) => (
            <GripElement
              key={`grip-${axis}`}
              data-axis={axis}
              mods={{ revealed: gripsRevealed }}
              aria-hidden="true"
            />
          ))}
          {resizeHandles.filter(isEdgeAxis).map((axis) => (
            <EdgeGripElement
              key={`edge-grip-${axis}`}
              data-axis={axis}
              mods={{ revealed: gripsRevealed, resizing: isResizing }}
              aria-hidden="true"
            >
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
            </EdgeGripElement>
          ))}
        </>
      ) : null}
    </BoardHostContext.Provider>
  );

  const pos = calcGridItemPosition(
    positionParams,
    item.x,
    item.y,
    item.w,
    item.h,
  );

  // While dragging with a pointer, the widget's visual floats in the shared
  // overlay so it is never clipped by an ancestor's `overflow: hidden`. The
  // gesture-owning element (the one carrying `moveProps`) must NOT be the node
  // that moves into the overlay: React Aria's `useMove` binds its pointer
  // move/end listeners relative to the node that received `onPointerDown`, and
  // relocating that node into the portal tears it down and mounts a fresh one
  // (inside a `pointerEvents: 'none'` layer), which can drop the in-flight
  // gesture. Instead we keep a stable, always-mounted in-grid host that owns the
  // gesture for its whole lifetime, and portal a separate, non-interactive
  // visual clone into the overlay.
  const overlayNode = registry.overlayRef.current;
  const floatInOverlay = useOverlay && !!overlayNode && !!dragState;

  const hostStyle: CSSProperties = {
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
    // Kept mounted but hidden while its clone floats, so the gesture stays live
    // on this node (the pointer listeners never get torn down).
    ...(floatInOverlay ? { opacity: 0, pointerEvents: 'none' } : null),
  };

  // The floating clone carries the "drag" affordance (raised shadow/z-index);
  // keep the hidden host flat. Keyboard drags (which never float) still
  // highlight the in-grid host, so only suppress `drag` when floating.
  const hostMods = { ...mods, drag: isActiveDrag && !floatInOverlay, settled };

  // The host is always rendered first, with a stable element shape, so React
  // reuses the same DOM node across the drag transition (never remounts it).
  const host = (
    <WidgetElement
      ref={hostRef}
      // Marks this element as a board widget host so the registry can find the
      // container widget a nested board lives in (used to keep a drag anchored to
      // a nested board while the anchor is still over its host - e.g. the Tabs
      // header above a nested board - instead of reflowing the ancestor board).
      data-board-widget-host=""
      {...mergeProps(
        gatedMoveProps,
        stopBubbleProps,
        hoverProps,
        focusProps,
        focusWithinProps,
        a11yProps,
        { style: hostStyle },
      )}
      qa={qa}
      mods={hostMods}
      styles={widgetStyles as Styles}
    >
      {floatInOverlay ? null : content}
    </WidgetElement>
  );

  const overlayClone = floatInOverlay
    ? createPortal(
        <WidgetElement
          style={{
            position: 'absolute',
            left: `${dragState!.rect.left}px`,
            top: `${dragState!.rect.top}px`,
            width: `${dragState!.rect.width}px`,
            height: `${dragState!.rect.height}px`,
            pointerEvents: 'none',
          }}
          mods={{ ...mods, drag: true, floating: true }}
          styles={widgetStyles as Styles}
          aria-hidden="true"
        >
          {content}
        </WidgetElement>,
        overlayNode!,
      )
    : null;

  return (
    <>
      {host}
      {overlayClone}
    </>
  );
}
