import { Styles, tasty } from '@tenphi/tasty';
import { CSSProperties, useMemo, useRef, useState } from 'react';
import { useFocusRing, useFocusWithin, useHover, useMove } from 'react-aria';
import { createPortal } from 'react-dom';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
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
import { BoardSelectModifierKey } from './use-board-select-modifier-key';

import type { BoardResizeGripPlacement } from './Widget';

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
    // Selection reads as a focus-like state here - it is transient, it follows
    // what the user is working with, and it is dropped the moment they touch
    // something else - so it is drawn as an edge treatment rather than as a
    // fill. `outline` stays reserved for the real focus ring (the kit's
    // convention everywhere), and the two are kept legible side by side by
    // token: selection is a saturated `#primary` ring, focus a `#primary-text`
    // outline sitting one border-width further out (`outlineOffset`).
    // A widget a live marquee currently covers gets the same treatment with the
    // ring dimmed, so releasing the pointer only changes the strength of an edge
    // that is already there — no geometry shift, nothing to re-read. The border
    // is *not* dimmed with it: `#primary-border` is close to `#border` on a dark
    // scheme, so fading it lands below the border a widget already has and the
    // preview would read as weaker than doing nothing.
    border: {
      '': false,
      card: true,
      'pre-selected': '#primary-border',
      selected: '#primary-border',
    },
    shadow: {
      '': false,
      'hovered & !card & (draggable | resizing)': '0 0 0 1bw #border',
      'pre-selected': '0 0 0 1bw #primary.40',
      selected: '0 0 0 1bw #primary',
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
    // A widget owns its grid cell and must not paint outside it: a nested board
    // with more rows than currently fit, a mid-drag reflow (an auto-height
    // container deliberately cannot grow while a drag is in flight), or a long
    // unbreakable string would otherwise spill over its neighbours. Clipping
    // holds regardless of `isCard` — a borderless widget has no drawn edge, but
    // it still has a cell.
    //
    // The cost is that a descendant's `outline` is cropped at the edge, since an
    // outline is clipped by an *ancestor's* overflow rather than its own. A
    // widget whose content needs to paint outside — a control drawing its own
    // active ring — opts out with `overflow="visible"`, or draws the ring inset
    // with a negative `outlineOffset`.
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
    '--handle-size': '3x',
    '--handle-overhang': '-8px',
    '--handle-inset': '1x',
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
    // Both placements derive from one number, so the grip can never drift out of
    // step with its own size: `inside` tucks it into the widget box, `corner`
    // centres it on the widget's corner - exactly half its own size back from
    // each edge. Consumers pick between them with `resizeGripPlacement` instead
    // of re-deriving these offsets from the outside.
    '--grip-size': '10px',
    '--grip-inset': '4px',
    '--grip-offset': {
      '': '$grip-inset',
      'placement=corner': '($grip-size / -2)',
    },
    width: '$grip-size',
    height: '$grip-size',
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
      '[data-axis="se"]': '4px bottom-right',
      '[data-axis="sw"]': '4px bottom-left',
      '[data-axis="ne"]': '4px top-right',
      '[data-axis="nw"]': '4px top-left',
    },
    top: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="nw"]': '$grip-offset',
    },
    bottom: {
      '': 'auto',
      '[data-axis="se"] | [data-axis="sw"]': '$grip-offset',
    },
    left: {
      '': 'auto',
      '[data-axis="nw"] | [data-axis="sw"]': '$grip-offset',
    },
    right: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="se"]': '$grip-offset',
    },
  },
});

/**
 * Where the corner grips are drawn when `resizeGripPlacement` is `'corner'`.
 *
 * `WidgetElement` clips its children (`overflow: hidden`, and that clipping is
 * load-bearing - see its own note), so a grip centred on the widget's corner
 * would be cut in half if it stayed inside. This layer mirrors the widget's grid
 * rect as a *sibling* of it, clips nothing, and never takes pointer events: the
 * transparent `HandleElement` inside the widget still owns the gesture, so
 * escaping the clip costs no hit-testing behaviour.
 *
 * It sits above a resting widget (`zIndex: 1`) so a grip is never hidden by the
 * neighbour it overhangs, and below a dragged or resized one (`zIndex: 10`) so a
 * lifted widget still paints over its neighbours' grips. The board's own content
 * box still clips it, so a grip on a widget flush against the board edge needs
 * `containerPadding` >= half the grip size to show in full.
 */
const GripLayerElement = tasty({
  qa: 'BoardResizeGripLayer',
  styles: {
    position: 'absolute',
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: 5,
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
   * Where the corner grips sit. Resolved by the owning `Board` from the
   * per-widget `resizeGripPlacement` and the board-level
   * `widgetProps.resizeGripPlacement` default.
   */
  resizeGripPlacement: BoardResizeGripPlacement;
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
  /** Whether this widget can be selected (board selection on and not opted out). */
  isSelectable?: boolean;
  isSelected?: boolean;
  /**
   * A live marquee currently covers this widget, so it *will* be selected when
   * the pointer is released. Provisional: it never reaches the selection model,
   * the callbacks or the live region.
   */
  isPreSelected?: boolean;
  /** CSS selector for descendants whose clicks must not change the selection. */
  selectionCancel?: string;
  /** Id of the board-owned node holding the shared "Selected" description. */
  selectedHintId?: string;
  /** Apply a selection gesture. `additive` toggles instead of replacing. */
  onSelect?: (id: string, additive: boolean) => void;
  /** Drop the whole selection. Called when the user interacts elsewhere. */
  onSelectionReset?: () => void;
  /** Pointer-event property carrying the platform additive-selection modifier. */
  selectModifierKey?: BoardSelectModifierKey;
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
    resizeGripPlacement,
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
    isSelectable = false,
    isSelected = false,
    isPreSelected = false,
    selectionCancel,
    selectedHintId,
    onSelect,
    onSelectionReset,
    selectModifierKey = 'metaKey',
  } = props;

  const { t } = useI18n();
  const ariaLabel = registration?.['aria-label'];
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isActiveDrag = dragState?.itemId === item.i;
  // Every member of a group drag floats, not just the grabbed one — otherwise
  // the rest sit motionless while their placeholders move, which reads as
  // broken. Only the grabbed host owns a live `useMove` gesture, so hiding the
  // others is trivially safe.
  const isDragMember = !!dragState?.itemIds.includes(item.i);

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

  // `role="group"` is what makes `aria-roledescription` legal here - it is
  // invalid on a role-less `div`, which is what this element used to be. A
  // collection role (`option`, `gridcell`, ...) would be the only way to carry a
  // real `aria-selected`, but those require presentational children and a
  // widget hosts arbitrary interactive content, so selection is conveyed by the
  // board's live region plus the shared description below instead.
  const a11yProps = {
    role: 'group',
    tabIndex: isDraggable || isSelectable ? 0 : undefined,
    'aria-roledescription': isDraggable
      ? t('board.draggableWidget', 'Draggable widget')
      : t('board.widget', 'Widget'),
    'aria-label': ariaLabel ?? qa ?? item.i,
    'aria-describedby': isSelected ? selectedHintId : undefined,
    'aria-keyshortcuts': isSelectable ? 'Space' : undefined,
  };

  // True from the moment a real move begins until the click that ends the
  // gesture has been swallowed. `useMove` binds only pointerdown/keydown, never
  // click, so a click handler composes with it cleanly - but the click that
  // *terminates* a drag would otherwise land as a selection. Event order is
  // pointerdown -> onMove* -> pointerup -> onMoveEnd -> click, so this ref is
  // always accurate by the time the click arrives. More reliable than a pixel
  // threshold, which has to guess.
  const isInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;

    return !!(selectionCancel && el?.closest?.(selectionCancel));
  };

  /**
   * Selecting and starting a drag are the *same* gesture: you grab the thing you
   * are about to move. So the press selects immediately and the drag arms behind
   * it — move and it drags, stay still and it was only a selection. This is what
   * every canvas tool does, and it is why there is no ambiguity to resolve with a
   * modifier.
   *
   *  - a press on an interactive descendant belongs to that control, so the
   *    selection is dropped and the press is left alone;
   *  - <kbd>Shift</kbd> or the platform modifier toggles membership;
   *  - a press on an unselected widget makes it the selection, so the drag that
   *    follows moves exactly what was grabbed;
   *  - a press on an already-selected widget changes nothing, so the drag moves
   *    the whole group.
   *
   * Runs before the drag handler (see the `mergeProps` order below), so the
   * registry resolves the group against the selection this press just made.
   */
  const handleSelectPointerDown = (e: React.PointerEvent) => {
    if (!isSelectable || !onSelect || e.button !== 0) return;

    if (isInteractiveTarget(e.target)) {
      onSelectionReset?.();

      return;
    }

    // A press this widget owns must never reach an ancestor widget host: in a
    // nested board the outer widget would otherwise select itself on top of the
    // inner selection. This has to cover the already-selected case too, which
    // changes nothing here but is still a press this board handled — and
    // `stopBubbleProps` below only guards draggable widgets.
    e.stopPropagation();

    if (e.shiftKey || e[selectModifierKey]) {
      onSelect(item.i, true);

      return;
    }

    if (!isSelected) {
      onSelect(item.i, false);
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    // Same guard the arrow keys use: only act when the host itself is focused,
    // so Space inside a nested input or button keeps its meaning.
    if (e.target !== e.currentTarget) return;
    if (!isSelectable || !onSelect) return;
    if (e.key !== ' ' && e.key !== 'Spacebar') return;

    // No modifier needed here: focus already says which widget is meant, and
    // Space cannot be mistaken for the start of a drag. Only swallow the key
    // once we know we are acting on it, so a board without selection still
    // scrolls on Space.
    e.preventDefault();
    e.stopPropagation();
    // Space is an explicit selection gesture (a click is also "interact with
    // this"), so it toggles - that is the keyboard's way to deselect one widget.
    onSelect(item.i, true);
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
    if (dragCancel && target.closest(dragCancel)) return true;

    // `selectionCancel` already declares which descendants are interactive, and
    // a drag must not start from them either — otherwise `useMove`'s
    // `preventDefault()` on pointer-down swallows the native focus and an input
    // inside a widget cannot be typed into. Only for selectable widgets, so a
    // board that never opted into selection keeps its exact previous behaviour
    // and `dragCancel` stays the only thing that gates a drag there.
    return !!(
      isSelectable &&
      selectionCancel &&
      target.closest(selectionCancel)
    );
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
            handleSelectKeyDown(e);
            if (e.defaultPrevented) return;
            moveProps.onKeyDown!(e);
          },
        }),
      };

  // A non-draggable widget gets no `moveProps` at all, so its Space handling and
  // its focusability have to come from here instead.
  const selectionProps = isSelectable
    ? {
        onPointerDown: handleSelectPointerDown,
        // A draggable widget routes Space through the drag gate below, which
        // already enforces the host-focused rule; a non-draggable one gets no
        // `moveProps` at all and needs its own handler.
        ...(isDraggable ? {} : { onKeyDown: handleSelectKeyDown }),
      }
    : {};

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
    selected: isSelected,
    // Mutually exclusive with `selected` by construction, so the two never
    // compete for precedence in a style map — and an additive lasso leaves the
    // widgets it already owns looking fully selected rather than downgrading
    // them to a preview.
    'pre-selected': isPreSelected && !isSelected,
  };

  const content = (
    <BoardHostContext.Provider value={hostValue}>
      {registration?.content}
      {isResizable && !item.static ? (
        <>
          {resizeHandles.map((axis) => (
            <ResizeHandle key={axis} axis={axis} onResize={handleResize} />
          ))}
          {/* `corner` grips are drawn in the sibling `GripLayerElement` below,
              which the widget's own `overflow: hidden` cannot clip. */}
          {resizeGripPlacement === 'corner'
            ? null
            : resizeHandles
                .filter(isCornerAxis)
                .map((axis) => (
                  <GripElement
                    key={`grip-${axis}`}
                    data-axis={axis}
                    mods={{ revealed: gripsRevealed, placement: 'inside' }}
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
  // Non-grabbed group members float too, from their own drag-start rect plus the
  // one shared gesture delta. Measuring them here would be wrong (the board is
  // mid-reflow); the registry measured every member once at drag start, which is
  // the only safe window.
  const memberRect = isDragMember
    ? dragState!.memberRects.get(item.i)
    : undefined;
  const floatInOverlay =
    !!overlayNode &&
    !!dragState &&
    dragState.pointerType !== 'keyboard' &&
    (useOverlay || (isDragMember && !!memberRect));

  // Where the floating clone sits. The grabbed widget tracks the live drag rect
  // directly; a member tracks its own start rect offset by the same delta, so
  // the block moves as one.
  const floatRect =
    floatInOverlay && dragState
      ? isActiveDrag || !memberRect
        ? dragState.rect
        : {
            left:
              memberRect.left +
              (dragState.rect.left - dragState.startRect.left),
            top:
              memberRect.top + (dragState.rect.top - dragState.startRect.top),
            width: memberRect.width,
            height: memberRect.height,
          }
      : null;

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
      // Which widget, as opposed to "am I inside a widget host" - the two are
      // separate questions and the existing attribute is used as a presence
      // selector, so overloading it would make every such selector implicitly
      // value-dependent. Namespaced so it cannot collide with an app's own
      // `data-widget-id`.
      data-board-widget-id={item.i}
      {...mergeProps(
        // Before `gatedMoveProps`: the press selects, and only then does the
        // drag start and read that selection to decide what moves.
        selectionProps,
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
            left: `${floatRect!.left}px`,
            top: `${floatRect!.top}px`,
            width: `${floatRect!.width}px`,
            height: `${floatRect!.height}px`,
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

  // Corner grips that must straddle the widget edge, hoisted out of the widget's
  // clip (see `GripLayerElement`). Positioned on the same grid rect as the host,
  // so the two stay in step through reflows and auto-height changes.
  const cornerAxes =
    isResizable && !item.static && resizeGripPlacement === 'corner'
      ? resizeHandles.filter(isCornerAxis)
      : [];
  const gripLayer = cornerAxes.length ? (
    <GripLayerElement
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`,
      }}
      aria-hidden="true"
    >
      {cornerAxes.map((axis) => (
        <GripElement
          key={`grip-${axis}`}
          data-axis={axis}
          mods={{ revealed: gripsRevealed, placement: 'corner' }}
          aria-hidden="true"
        />
      ))}
    </GripLayerElement>
  ) : null;

  return (
    <>
      {host}
      {gripLayer}
      {overlayClone}
    </>
  );
}
