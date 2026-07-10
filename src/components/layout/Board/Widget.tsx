import { CONTAINER_STYLES, ContainerStyleProps, Styles } from '@tenphi/tasty';
import { ReactNode, useEffect, useRef } from 'react';

import { useLayoutEffect } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { useBoardRegistry } from './board-context';
import { LayoutConstraint, ResizeHandleAxis } from './grid-core';

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
  /**
   * Render this widget as a card by adding a border. Widgets are always filled
   * (`#surface-2`) and rounded; `isCard` adds the border on top. Defaults to
   * `false` (borderless) unless the owning `Board`'s `widgetProps.isCard` opts
   * in. Override per widget to enable or disable.
   */
  isCard?: boolean;
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
   * these styles (the `styles` object wins on conflicts).
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
    isCard,
    minW,
    maxW,
    minH,
    maxH,
    constraints,
    qa,
    isAutoHeight,
    dragCancel,
    dragHandle,
  } = props;
  const registry = useBoardRegistry();

  // Collect direct style props (e.g. `fill`, `padding`, `radius`) and merge them
  // with the explicit `styles` prop, mirroring how `Board` extracts its own
  // styles. Fall back to `undefined` when nothing was provided so widgets with
  // no styling keep a stable registration (avoids needless store churn).
  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const styles =
    Object.keys(extractedStyles).length > 0 ? extractedStyles : undefined;

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
        isCard,
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
