import { Styles } from '@tenphi/tasty';
import { ReactNode, useEffect, useRef } from 'react';

import { useLayoutEffect } from '../../../utils/react';

import { useBoardRegistry } from './board-context';
import { LayoutConstraint, ResizeHandleAxis } from './grid-core';

export interface CubeBoardWidgetProps {
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
  /** Style overrides applied to the rendered widget element. */
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
  } = props;
  const registry = useBoardRegistry();

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
