import { ReactNode, RefObject, useCallback, useMemo } from 'react';
import {
  DragItem,
  DroppableCollectionReorderEvent,
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  useDraggableCollection,
  useDroppableCollection,
} from 'react-aria';
import {
  DraggableCollectionState,
  DroppableCollectionState,
  useDraggableCollectionState,
  useDroppableCollectionState,
} from 'react-stately';

import { useEvent } from '../../_internal/hooks';

import type { Collection, DropOperation, Key, Node } from '@react-types/shared';

const getAllowedDropOperations = (): DropOperation[] => ['move'];

// =============================================================================
// Types
// =============================================================================

export interface DraggableCollectionProps {
  state: {
    collection: Collection<Node<any>>;
    selectionManager: { selectedKeys: Set<Key> } & Record<string, any>;
    disabledKeys: Set<Key>;
  };
  listRef: RefObject<HTMLElement | null>;
  orderedKeys: string[];
  orientation: 'horizontal' | 'vertical';
  onReorder?: (newOrder: string[]) => void;
  children: (
    dragState: DraggableCollectionState,
    dropState: DroppableCollectionState,
    collectionProps: Record<string, unknown>,
  ) => ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Generic wrapper that enables drag-and-drop reordering for a collection.
 *
 * Used by both DraggableTabList (horizontal) and DraggableListBox (vertical).
 * Encapsulates all drag/drop hook calls so they are only invoked when
 * reordering is actually enabled.
 */
export function DraggableCollection({
  state,
  listRef,
  orderedKeys,
  orientation,
  onReorder,
  children,
}: DraggableCollectionProps) {
  const handleReorder = useEvent((e: DroppableCollectionReorderEvent) => {
    if (!onReorder) return;

    const { target, keys: movableKeys } = e;
    const { dropPosition, key: targetKey } = target;
    const movableKey = [...movableKeys][0] as string;

    const movableIndex = orderedKeys.indexOf(movableKey);
    const targetIndex = orderedKeys.indexOf(String(targetKey));

    if (movableIndex === -1 || targetIndex === -1) return;

    const newKeys =
      movableIndex !== targetIndex
        ? orderedKeys.reduce((arr, key, i) => {
            if (i === movableIndex) {
              return arr;
            }

            if (i === targetIndex) {
              if (dropPosition === 'before') {
                arr.push(movableKey);
                arr.push(key);
              } else {
                arr.push(key);
                arr.push(movableKey);
              }
            } else {
              arr.push(key);
            }

            return arr;
          }, [] as string[])
        : orderedKeys;

    onReorder(newKeys);
  });

  const getItems = useCallback(
    (keys: Set<Key>): DragItem[] => {
      return [...keys].map((key) => {
        const item = state.collection.getItem(key);
        return {
          'text/plain': item?.textValue || String(key),
        };
      });
    },
    [state.collection],
  );

  const dragState = useDraggableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    getItems,
    getAllowedDropOperations,
  });

  useDraggableCollection(
    {
      getItems,
      getAllowedDropOperations,
    },
    dragState,
    listRef,
  );

  const dropState = useDroppableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    onReorder: handleReorder,
  });

  const keyboardDelegate = useMemo(
    () =>
      new ListKeyboardDelegate(state.collection, state.disabledKeys, listRef),
    [state.collection, state.disabledKeys, listRef],
  );

  const dropTargetDelegate = useMemo(
    () =>
      new ListDropTargetDelegate(state.collection, listRef, {
        orientation,
      }),
    [state.collection, listRef, orientation],
  );

  const { collectionProps } = useDroppableCollection(
    {
      keyboardDelegate,
      dropTargetDelegate,
      onReorder: handleReorder,
    },
    dropState,
    listRef,
  );

  return children(dragState, dropState, collectionProps);
}
