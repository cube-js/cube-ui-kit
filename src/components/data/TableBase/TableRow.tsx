import { useRef } from 'react';
import { useDraggableItem, useDropIndicator, useTreeItem } from 'react-aria';

import { mergeProps, mergeRefs } from '../../../utils/react';

import type { Key, Node } from '@react-types/shared';
import type { ReactNode, Ref } from 'react';
import type {
  DraggableCollectionState,
  DroppableCollectionState,
  TreeState,
} from 'react-stately';
import type { TableTreeNode } from './table-tree';

export interface TableRowTreeProps<T = any> {
  state: TreeState<TableTreeNode<T>>;
  node: Node<TableTreeNode<T>>;
  entry: TableTreeNode<T>;
  isVirtualized: boolean;
}

export interface TableRowProps<T = any> {
  rowKey: Key;
  /** Everything the renderer already computed: mods, ARIA, handlers. */
  rowProps: Record<string, any>;
  height?: number;
  /** Set on the virtualized path so the virtualizer can measure the row. */
  measureRef?: Ref<HTMLTableRowElement>;
  /** Internal React Aria row ref in tree mode. */
  rowRef?: Ref<HTMLTableRowElement>;
  index?: number;
  dragState?: DraggableCollectionState;
  dropState?: DroppableCollectionState;
  tree?: TableRowTreeProps<T>;
  children:
    | ReactNode
    | ((treeItemAria: ReturnType<typeof useTreeItem> | undefined) => ReactNode);
}

function Row(
  props: TableRowProps & {
    extra?: Record<string, any>;
    rowRef?: Ref<HTMLTableRowElement>;
  },
) {
  const { rowProps, height, measureRef, rowRef, index, extra, children } =
    props;

  return (
    <tr
      {...rowProps}
      {...extra}
      ref={mergeRefs(measureRef, rowRef)}
      data-index={index}
      style={height != null ? { height } : undefined}
    >
      {typeof children === 'function' ? children(undefined) : children}
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

function TreeRow<T>(props: TableRowProps<T>) {
  const { tree } = props;
  const rowRef = useRef<HTMLTableRowElement>(null);
  const treeItemAria = useTreeItem(
    {
      node: tree!.node,
      hasChildItems: tree!.entry.children.length > 0,
      isVirtualized: tree!.isVirtualized,
    },
    tree!.state,
    rowRef,
  );

  const rowProps = mergeProps(treeItemAria.rowProps, props.rowProps);

  // Table geometry and ItemTable selection are separate from React Aria's
  // internal focus-only selection manager, so the renderer's values win.
  if (props.rowProps['aria-rowindex'] !== undefined) {
    rowProps['aria-rowindex'] = props.rowProps['aria-rowindex'];
  }
  if (props.rowProps['aria-selected'] !== undefined) {
    rowProps['aria-selected'] = props.rowProps['aria-selected'];
  }
  rowProps['aria-level'] = tree!.entry.level + 1;
  rowProps['aria-posinset'] = tree!.entry.siblingIndex + 1;
  rowProps['aria-setsize'] = tree!.entry.siblingCount;

  const children =
    typeof props.children === 'function'
      ? props.children(treeItemAria)
      : props.children;
  const next = { ...props, rowProps, rowRef, children };

  return props.dragState && props.dropState ? (
    <DraggableRow {...next} />
  ) : (
    <Row {...next} />
  );
}

export function TableRow<T>(props: TableRowProps<T>) {
  if (props.tree) return <TreeRow {...props} />;

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
