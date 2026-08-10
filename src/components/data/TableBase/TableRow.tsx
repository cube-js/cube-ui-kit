import { useRef } from 'react';
import { useDraggableItem, useDropIndicator } from 'react-aria';

import { mergeProps } from '../../../utils/react';

import type { Key } from '@react-types/shared';
import type { ReactNode, Ref } from 'react';
import type {
  DraggableCollectionState,
  DroppableCollectionState,
} from 'react-stately';

export interface TableRowProps {
  rowKey: Key;
  /** Everything the renderer already computed: mods, ARIA, handlers. */
  rowProps: Record<string, any>;
  height?: number;
  /** Set on the virtualized path so the virtualizer can measure the row. */
  measureRef?: Ref<HTMLTableRowElement>;
  index?: number;
  dragState?: DraggableCollectionState;
  dropState?: DroppableCollectionState;
  children: ReactNode;
}

function Row(props: TableRowProps & { extra?: Record<string, any> }) {
  const { rowProps, height, measureRef, index, extra, children } = props;

  return (
    <tr
      {...rowProps}
      {...extra}
      ref={measureRef}
      data-index={index}
      style={height != null ? { height } : undefined}
    >
      {children}
    </tr>
  );
}

/**
 * A row inside a collection that accepts drags.
 *
 * Split from the plain row so the drag hooks can be called unconditionally —
 * they are hooks, and whether a table is draggable is a prop.
 */
function DraggableRow(props: TableRowProps) {
  const { rowKey, dragState, dropState } = props;

  const dragResult = useDraggableItem(
    { key: rowKey },
    dragState as DraggableCollectionState,
  );

  /**
   * Whether a drop would land *on* this row.
   *
   * `useDropIndicator` rather than asking `dropState.isDropTarget` directly:
   * the state object's identity never changes as the pointer moves, so a plain
   * read is computed once and never updates. The hook subscribes, which is what
   * makes the highlight follow the cursor.
   */
  const onRef = useRef<HTMLDivElement>(null);
  const { isDropTarget: isOnTarget } = useDropIndicator(
    { target: { type: 'item', key: rowKey, dropPosition: 'on' } },
    dropState as DroppableCollectionState,
    onRef,
  );

  return (
    <Row
      {...props}
      extra={{
        ...mergeProps(props.rowProps, dragResult.dragProps),
        'data-draggable': '',
        'data-dragging': dragResult.isDragging ? '' : undefined,
        'data-drop-target': isOnTarget ? '' : undefined,
      }}
    />
  );
}

export function TableRow(props: TableRowProps) {
  return props.dragState && props.dropState ? (
    <DraggableRow {...props} />
  ) : (
    <Row {...props} />
  );
}

export interface TableRowDropIndicatorProps {
  rowKey: Key;
  dropPosition: 'before' | 'after';
  dropState: DroppableCollectionState;
  columnCount: number;
}

/**
 * The line showing where a dragged row would land.
 *
 * Its own `<tr>`, because a native table cannot hold an arbitrary element
 * between two rows — the same shape `ListBox` uses with `<li>`. It renders
 * nothing at all unless a drag is in flight, so the table's normal structure is
 * untouched the rest of the time.
 */
export function TableRowDropIndicator(props: TableRowDropIndicatorProps) {
  const { rowKey, dropPosition, dropState, columnCount } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target: { type: 'item', key: rowKey, dropPosition } },
    dropState,
    ref,
  );

  if (isHidden) return null;

  return (
    <tr data-element="DropIndicatorRow">
      <td data-element="DropIndicatorCell" colSpan={Math.max(columnCount, 1)}>
        <div
          {...dropIndicatorProps}
          ref={ref}
          data-element="DropIndicator"
          data-drop-target={isDropTarget ? '' : undefined}
        />
      </td>
    </tr>
  );
}
