import { useRef } from 'react';
import { useMove } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps } from '../../../utils/react';

import type { CubeResolvedColumn } from './types';

export interface ColumnResizerProps<T> {
  column: CubeResolvedColumn<T>;
  label: string;
  /** Live during the drag, so the column follows the pointer. */
  onResize: (columnKey: string, width: number) => void;
  /** Once, when the drag or key press finishes. For persistence and callbacks. */
  onResizeEnd: (columnKey: string) => void;
}

/**
 * The grab handle on a column's trailing edge.
 *
 * `useMove` rather than raw pointer events: it normalises pointer, touch and
 * **keyboard** into one stream, so arrow keys resize without any extra work —
 * an affordance ag-grid never gave Cloud. The same hook drives `Board`'s widget
 * resizing, so the interaction model matches.
 */
export function ColumnResizer<T>(props: ColumnResizerProps<T>) {
  const { column, label, onResize, onResizeEnd } = props;

  // The width the drag started from. Deltas are relative to it, so a slow drag
  // does not accumulate rounding the way summing per-move widths would.
  const startWidthRef = useRef(0);
  const widthRef = useRef(0);

  const clamp = useEvent((width: number) => {
    const min = column.minWidth;
    const max = column.maxWidth;

    return Math.max(min, max == null ? width : Math.min(width, max));
  });

  const { moveProps } = useMove({
    onMoveStart() {
      startWidthRef.current = column.width ?? column.minWidth;
      widthRef.current = startWidthRef.current;
    },
    onMove(event) {
      // `pointer` moves carry deltas in px; keyboard moves carry ±1 per press,
      // which would be an imperceptible step, so they are scaled to a grid unit.
      const step = event.pointerType === 'keyboard' ? 8 : 1;

      widthRef.current = clamp(widthRef.current + event.deltaX * step);
      onResize(column.key, widthRef.current);
    },
    onMoveEnd() {
      onResizeEnd(column.key);
    },
  });

  // `mergeProps`, not spread-then-override: `useMove` implements the keyboard
  // half of the interaction through its own `onKeyDown`, and a plain `onKeyDown`
  // prop after the spread would silently replace it — leaving the handle
  // draggable but not operable from the keyboard.
  const handlerProps = mergeProps(moveProps, {
    // The header cell sorts on click; a press on the handle is not a sort.
    onClick(event: { stopPropagation: () => void }) {
      event.stopPropagation();
    },
    onKeyDown(event: {
      key: string;
      preventDefault: () => void;
      stopPropagation: () => void;
    }) {
      // `useMove` claims the arrows. Home/End are ours, and they are the
      // fastest way to reach the extremes.
      if (event.key !== 'Home' && event.key !== 'End') {
        event.stopPropagation();

        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onResize(
        column.key,
        event.key === 'Home' ? column.minWidth : column.maxWidth ?? 1000,
      );
      onResizeEnd(column.key);
    },
  });

  return (
    <div
      {...handlerProps}
      data-element="Resizer"
      // A separator is the role a resize handle takes when it splits two
      // regions, and it is what makes the value readable to a screen reader.
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={column.width ?? undefined}
      aria-valuemin={column.minWidth}
      aria-valuemax={column.maxWidth ?? undefined}
    >
      <div data-element="ResizerLine" />
    </div>
  );
}
