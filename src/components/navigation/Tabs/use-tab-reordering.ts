import { useCallback } from 'react';
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

import type { Key } from '@react-types/shared';
import type { RefObject } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseTabReorderingOptions {
  /** Whether reordering is enabled */
  isReorderable: boolean;
  /** Tab list state from React Stately */
  state: TabListState<object>;
  /** Ref to the tab list container */
  listRef: RefObject<HTMLDivElement | null>;
  /** Current ordered keys */
  orderedKeys: string[];
  /** Callback when tabs are reordered */
  onReorder?: (newOrder: Key[]) => void;
}

export interface UseTabReorderingResult {
  /** Drag state (undefined if not reorderable) */
  dragState: DraggableCollectionState | undefined;
  /** Drop state (undefined if not reorderable) */
  dropState: DroppableCollectionState | undefined;
  /** Collection props to spread on the container */
  collectionProps: Record<string, unknown>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage drag-and-drop tab reordering.
 *
 * Sets up draggable and droppable collection states from React Aria
 * and handles the reorder logic when tabs are dropped.
 */
export function useTabReordering({
  isReorderable,
  state,
  listRef,
  orderedKeys,
  onReorder,
}: UseTabReorderingOptions): UseTabReorderingResult {
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
              } else if (dropPosition === 'after') {
                arr.push(key);
                arr.push(movableKey);
              } else {
                arr.push(key);
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
    getAllowedDropOperations: () => ['move'],
  });

  // Actually enable the draggable collection hook only when isReorderable
  useDraggableCollection(
    isReorderable
      ? {
          getItems,
          getAllowedDropOperations: () => ['move'],
        }
      : { getItems: () => [], getAllowedDropOperations: () => [] },
    dragState,
    listRef,
  );

  // Setup drop state for the collection
  const dropState = useDroppableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    onReorder: handleReorder,
  });

  const { collectionProps } = useDroppableCollection(
    isReorderable
      ? {
          keyboardDelegate: new ListKeyboardDelegate(
            state.collection,
            state.disabledKeys,
            listRef,
          ),
          dropTargetDelegate: new ListDropTargetDelegate(
            state.collection,
            listRef,
            { orientation: 'horizontal' },
          ),
          onReorder: handleReorder,
        }
      : {
          keyboardDelegate: undefined as any,
          dropTargetDelegate: undefined as any,
        },
    dropState,
    listRef,
  );

  // Return undefined states when not reorderable
  if (!isReorderable) {
    return {
      dragState: undefined,
      dropState: undefined,
      collectionProps: {},
    };
  }

  return {
    dragState,
    dropState,
    collectionProps,
  };
}
