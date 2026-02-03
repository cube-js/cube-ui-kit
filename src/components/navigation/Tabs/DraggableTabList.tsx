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
  TabListState,
  useDraggableCollectionState,
  useDroppableCollectionState,
} from 'react-stately';

import { useEvent } from '../../../_internal/hooks';

import type { DropOperation, Key } from '@react-types/shared';

// Stable function reference to avoid re-renders in drag/drop hooks
const getAllowedDropOperations = (): DropOperation[] => ['move'];

// =============================================================================
// Types
// =============================================================================

export interface DraggableTabListProps {
  /** Tab list state from React Stately */
  state: TabListState<object>;
  /** Ref to the tab list container */
  listRef: RefObject<HTMLDivElement | null>;
  /** Current ordered keys */
  orderedKeys: string[];
  /** Callback when tabs are reordered */
  onReorder?: (newOrder: string[]) => void;
  /** Render function that receives drag/drop states */
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
 * Component that enables drag-and-drop reordering for tabs.
 *
 * This component encapsulates all drag/drop hook calls, ensuring they're only
 * called when reordering is actually enabled. It uses the render prop pattern
 * to pass the drag/drop states to its children.
 */
export function DraggableTabList({
  state,
  listRef,
  orderedKeys,
  onReorder,
  children,
}: DraggableTabListProps) {
  // Handle reorder event from drag-and-drop
  const handleReorder = useEvent((e: DroppableCollectionReorderEvent) => {
    if (!onReorder) return;

    const { target, keys: movableKeys } = e;
    const { dropPosition, key: targetKey } = target;
    const movableKey = [...movableKeys][0] as string;

    const movableIndex = orderedKeys.indexOf(movableKey);
    const targetIndex = orderedKeys.indexOf(String(targetKey));

    if (movableIndex === -1 || targetIndex === -1) return;

    // Reorder keys
    const newKeys =
      movableIndex !== targetIndex
        ? orderedKeys.reduce((arr, key, i) => {
            // Skip the key we are moving
            if (i === movableIndex) {
              return arr;
            }

            // Insert the movable key at the target position
            if (i === targetIndex) {
              if (dropPosition === 'before') {
                arr.push(movableKey);
                arr.push(key);
              } else {
                // 'after' or 'on' - treat 'on' as 'after' since tabs are linear
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

  // Get items for draggable collection
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

  // Setup drag state for the collection
  const dragState = useDraggableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    getItems,
    getAllowedDropOperations,
  });

  // Enable the draggable collection
  useDraggableCollection(
    {
      getItems,
      getAllowedDropOperations,
    },
    dragState,
    listRef,
  );

  // Setup drop state for the collection
  const dropState = useDroppableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    onReorder: handleReorder,
  });

  // Create delegates for drop handling
  const keyboardDelegate = useMemo(
    () =>
      new ListKeyboardDelegate(state.collection, state.disabledKeys, listRef),
    [state.collection, state.disabledKeys, listRef],
  );

  const dropTargetDelegate = useMemo(
    () =>
      new ListDropTargetDelegate(state.collection, listRef, {
        orientation: 'horizontal',
      }),
    [state.collection, listRef],
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
