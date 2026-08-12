import { useEffect, useRef, useState } from 'react';
import { useDraggableItem, useDropIndicator } from 'react-aria';

import { mergeProps } from '../../../utils/react';

import type { ReactNode } from 'react';
import type {
  DraggableCollectionState,
  DroppableCollectionState,
} from 'react-stately';

/**
 * Controls inside the header that own their own press, and must never start a
 * column drag.
 *
 * Drag-source resolution walks the DOM tree, not the React event path, so
 * `Item`'s `Actions` slot calling `stopPropagation` does nothing here — the
 * `<th>` is still the drag source as far as the browser is concerned. Only
 * `preventDefault` on `dragstart` stops it, which is what the capture handler
 * below does.
 */
const NO_DRAG_SELECTOR =
  '[data-element="Resizer"], [data-element="Actions"], a, button, input, select, textarea, [role="button"], [role="menuitem"]';

export interface TableHeaderCellProps {
  columnKey: string;
  /** Everything the renderer already computed: mods, ARIA, handlers, styles. */
  cellProps: Record<string, any>;
  /** Whether the header itself responds to Enter — i.e. it sorts. */
  hasAction: boolean;
  isLastDraggable: boolean;
  dragState?: DraggableCollectionState;
  dropState?: DroppableCollectionState;
  children: ReactNode;
}

function HeaderCell(
  props: TableHeaderCellProps & { extra?: Record<string, any> },
) {
  const { cellProps, extra, children } = props;

  return (
    <th {...cellProps} {...extra}>
      {children}
    </th>
  );
}

/**
 * A header cell inside a collection that accepts drags.
 *
 * Split from the plain one so the drag hooks can be called unconditionally —
 * they are hooks, and whether a table reorders its columns is a prop.
 */
function DraggableHeaderCell(props: TableHeaderCellProps) {
  const { columnKey, hasAction, isLastDraggable, dragState, dropState } = props;

  const { dragProps, isDragging } = useDraggableItem(
    // `hasAction` re-gates React Aria's Enter/Space capture behind Alt, so plain
    // Enter still reaches the header's own sort handler instead of starting a
    // keyboard drag session.
    { key: columnKey, hasAction },
    dragState as DraggableCollectionState,
  );

  return (
    <HeaderCell
      {...props}
      extra={{
        // `dragProps` last for `draggable`, which is a value rather than a
        // handler — `mergeProps` chains handlers but takes the later value. The
        // sort `onClick` survives: `useDraggableItem` only deletes its own.
        ...mergeProps(props.cellProps, dragProps, {
          // Capture, so this runs before React Aria's own `onDragStart` on the
          // same node and can cancel it.
          onDragStartCapture: (event: any) => {
            if ((event.target as HTMLElement)?.closest?.(NO_DRAG_SELECTOR)) {
              event.preventDefault();
              event.stopPropagation();
            }
          },
        }),
        'data-draggable': '',
        'data-dragging': isDragging ? '' : undefined,
      }}
    >
      <ColumnDropIndicator
        columnKey={columnKey}
        dropPosition="before"
        dropState={dropState as DroppableCollectionState}
      />
      {props.children}
      {isLastDraggable ? (
        <ColumnDropIndicator
          columnKey={columnKey}
          dropPosition="after"
          dropState={dropState as DroppableCollectionState}
        />
      ) : null}
    </HeaderCell>
  );
}

export function TableHeaderCell(props: TableHeaderCellProps) {
  return props.dragState && props.dropState ? (
    <DraggableHeaderCell {...props} />
  ) : (
    <HeaderCell {...props} />
  );
}

interface ColumnDropIndicatorProps {
  columnKey: string;
  dropPosition: 'before' | 'after';
  dropState: DroppableCollectionState;
}

/**
 * The line showing where a dragged column would land.
 *
 * Lives INSIDE the `<th>`, absolutely positioned on one of its edges — a `<tr>`
 * may only contain `<th>`/`<td>`, so there is nowhere between two header cells
 * to put it. Being absolute also means mounting one cannot shift the layout,
 * which is the bug class the row indicator had to be careful about.
 *
 * `useDropIndicator` reports `isHidden` unless this is the active target, so a
 * table merely capable of reordering keeps its exact DOM until a drag starts.
 */
function ColumnDropIndicator({
  columnKey,
  dropPosition,
  dropState,
}: ColumnDropIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target: { type: 'item', key: columnKey, dropPosition } },
    dropState,
    ref,
  );

  /**
   * Re-register the drop targets when the header's geometry changes.
   *
   * React Aria's `ListDropTargetDelegate` measures every `[data-key]` at the
   * moment a drag starts. A column resized mid-drag — or a scrollbar appearing —
   * leaves those rects stale, and the drop lands in the wrong place. Same trick
   * `TabDropIndicator` uses.
   */
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const row = ref.current?.closest('[data-element="HeadRow"]');

    if (!row || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => forceUpdate((n) => n + 1));

    observer.observe(row);

    return () => observer.disconnect();
  }, []);

  if (isHidden) return null;

  return (
    <div
      {...dropIndicatorProps}
      ref={ref}
      data-element="ColumnDropIndicator"
      data-position={dropPosition}
      data-drop-target={isDropTarget ? '' : undefined}
    />
  );
}
