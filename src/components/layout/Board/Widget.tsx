import { CONTAINER_STYLES, ContainerStyleProps, Styles } from '@tenphi/tasty';
import { ReactNode, useEffect, useRef } from 'react';

import { useLayoutEffect } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { useBoardRegistry } from './board-context';
import { LayoutConstraint, ResizeHandleAxis } from './grid-core';

/**
 * Where a corner resize grip sits relative to the widget's corner.
 *
 * - `'inside'` - tucked into the widget box (the default).
 * - `'corner'` - centred on the corner itself, so it lines up with a control
 *   centred on the opposite corner. The grip is drawn outside the widget's own
 *   clip to make this possible, so it needs the board to have at least half a
 *   grip's worth of `containerPadding` to show in full at the board's edge.
 *
 * Only affects corner handles (`ne`/`nw`/`se`/`sw`); the dotted edge grips
 * (`n`/`s`/`e`/`w`) always sit inside the widget.
 */
export type BoardResizeGripPlacement = 'inside' | 'corner';

/** Which corner of a widget a piece of chrome is anchored to. */
export type BoardCornerPlacement = 'ne' | 'nw' | 'se' | 'sw';

export interface CubeBoardWidgetProps extends ContainerStyleProps {
  /** Unique id, must match the `i` of a layout item in a `Board`. */
  id: string;
  /** Widget content. */
  children?: ReactNode;
  /** Disable dragging for this widget. */
  isDraggable?: boolean;
  /** Disable resizing for this widget. */
  isResizable?: boolean;
  /** Which resize handles to show (overrides the board default). */
  resizeHandles?: ResizeHandleAxis[];
  /** Where the corner resize grips sit (overrides the board default). */
  resizeGripPlacement?: BoardResizeGripPlacement;
  /**
   * Render this widget as a card by adding a border. Widgets are always filled
   * (`#surface-2`) and rounded; `isCard` adds the border on top. Defaults to
   * `false` (borderless) unless the owning `Board`'s `widgetProps.isCard` opts
   * in. Override per widget to enable or disable.
   */
  isCard?: boolean;
  /**
   * Whether the widget shows the resting ring on hover. On by default: it is the
   * affordance that says a widget can be picked up. Turn it off for a widget
   * that is scenery rather than a thing to grab — a chromeless layout container,
   * a spacer — where the ring advertises an interaction the widget does not
   * really offer. Selection and drag treatments are unaffected.
   * @default true
   */
  hoverRing?: boolean;
  /**
   * A control anchored to one corner of the widget and centred on it — a
   * settings button, a badge, a remove affordance.
   *
   * Drawn in the same layer as the corner resize grips, which is the layer that
   * escapes the widget's own clip. Hanging such a control off the corner from
   * inside the widget gets it cropped in half by that clip, or by an ancestor's
   * scroll container when the widget is in the first row. It is also outside the
   * drag gesture, so a press on it can never start a drag.
   */
  cornerChrome?: ReactNode;
  /**
   * Which corner {@link cornerChrome} sits on. Pair it with a
   * `resizeGripPlacement="corner"` grip on the opposite corner and the two line
   * up. @default 'ne'
   */
  cornerChromePlacement?: BoardCornerPlacement;
  /**
   * App-defined modifiers for this widget, merged into the ones the board sets
   * so a `styles` map can match on app state: `mods={{ editing: true }}` with
   * `styles={{ shadow: { editing: '0 0 0 1bw #primary' } }}`.
   *
   * Board's own modifiers always win, so a custom one can never shadow
   * `selected`, `drag` and the rest.
   */
  mods?: Record<string, boolean | string | undefined>;
  /** Minimum width in grid columns (used when the layout item omits `minW`). */
  minW?: number;
  /** Maximum width in grid columns (used when the layout item omits `maxW`). */
  maxW?: number;
  /** Minimum height in grid rows (used when the layout item omits `minH`). */
  minH?: number;
  /** Maximum height in grid rows (used when the layout item omits `maxH`). */
  maxH?: number;
  /** Per-widget layout constraints. */
  constraints?: LayoutConstraint[];
  /** Test id applied to the rendered widget element. */
  qa?: string;
  /**
   * Style overrides applied to the rendered widget element. Individual style
   * props (`fill`, `padding`, `radius`, `border`, ...) can also be passed
   * directly on `Board.Widget`, just like on `Board`; they are merged into
   * these styles (a direct prop wins over the same key in the `styles` object).
   */
  styles?: Styles;
  /**
   * Grow this widget's height in its board to fit its content (only ever
   * increases). Pair with a nested `Board isAligned` to make the container
   * expand until the inner board's rows fit at the parent's row height.
   */
  isAutoHeight?: boolean;
  /**
   * CSS selector for elements that must not start a pointer drag inside this
   * widget (overrides the board's `dragCancel`).
   */
  dragCancel?: string;
  /**
   * CSS selector for the only elements from which a pointer drag may start
   * inside this widget (overrides the board's `dragHandle`).
   */
  dragHandle?: string;
  /**
   * Disable selection for this widget while the board's `selectionMode` is on.
   * Symmetric with `isDraggable` / `isResizable`.
   */
  isSelectable?: boolean;
  /**
   * CSS selector for descendants whose clicks must not change the selection
   * inside this widget (overrides the board's `selectionCancel`).
   */
  selectionCancel?: string;
  /**
   * Accessible name for the widget. Falls back to `qa`, then the layout item id
   * — both of which are developer-facing, so set this whenever the widget is
   * user-visible. Also used for the single-selection announcement.
   */
  'aria-label'?: string;
}

/**
 * Shallow-compare two style maps by their top-level keys. Direct style props
 * (e.g. `fill`) are primitives, so this reliably detects a real change while
 * ignoring the fresh object identity `extractStyles` produces each render.
 */
function shallowEqualStyles(a?: Styles, b?: Styles): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (
      (a as Record<string, unknown>)[key] !==
      (b as Record<string, unknown>)[key]
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Declares a widget's content and per-widget options. Rendering and positioning
 * are performed by the owning `Board` (the component itself renders nothing),
 * which is what allows a widget to be transferred between boards.
 */
export function Widget(props: CubeBoardWidgetProps) {
  const {
    id,
    children,
    isDraggable,
    isResizable,
    resizeHandles,
    resizeGripPlacement,
    isCard,
    hoverRing,
    cornerChrome,
    cornerChromePlacement,
    mods,
    minW,
    maxW,
    minH,
    maxH,
    constraints,
    qa,
    isAutoHeight,
    dragCancel,
    dragHandle,
    isSelectable,
    selectionCancel,
    'aria-label': ariaLabel,
  } = props;
  const registry = useBoardRegistry();

  // Collect direct style props (e.g. `fill`, `padding`, `radius`) and merge them
  // with the explicit `styles` prop, mirroring how `Board` extracts its own
  // styles. Fall back to `undefined` when nothing was provided so widgets with
  // no styling keep a stable registration (avoids needless store churn).
  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const nextStyles =
    Object.keys(extractedStyles).length > 0 ? extractedStyles : undefined;

  // `extractStyles` returns a fresh object every render, so passing it straight
  // to `register` would make the store treat every render as a style change,
  // bump its version, and re-render the hosting board in a loop. Keep a stable
  // reference across renders and only swap it when the shallow style values
  // actually change (direct props are primitives; a `styles` object is compared
  // per top-level key).
  const stylesRef = useRef<Styles | undefined>(undefined);
  if (!shallowEqualStyles(stylesRef.current, nextStyles)) {
    stylesRef.current = nextStyles;
  }
  const styles = stylesRef.current;

  // Stable per-instance token so a stale unregister (from an unmounting copy of
  // this widget) can't wipe out a newer instance's registration.
  const ownerRef = useRef({});

  // Register/update content on every render so content stays fresh in the store.
  useLayoutEffect(() => {
    registry?.store.register(
      {
        id,
        content: children,
        isDraggable,
        isResizable,
        resizeHandles,
        resizeGripPlacement,
        isCard,
        hoverRing,
        cornerChrome,
        cornerChromePlacement,
        mods,
        minW,
        maxW,
        minH,
        maxH,
        constraints,
        qa,
        styles,
        isAutoHeight,
        dragCancel,
        dragHandle,
        isSelectable,
        selectionCancel,
        'aria-label': ariaLabel,
      },
      ownerRef.current,
    );
  });

  // Remove from the store on unmount.
  useEffect(() => {
    const owner = ownerRef.current;
    return () => {
      registry?.store.unregister(id, owner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}
