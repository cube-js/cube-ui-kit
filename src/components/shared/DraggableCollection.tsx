import {
  KeyboardEvent,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  DragItem,
  DroppableCollectionReorderEvent,
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  mergeProps,
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

/**
 * Creates a no-op mock of DraggableCollectionState.
 * Used to satisfy useDraggableItem when drag is disabled (Rules of Hooks).
 */
export function createMockDragState(
  collection: Collection<Node<any>>,
  selectionManager: Record<string, any>,
): DraggableCollectionState {
  return {
    collection,
    selectionManager,
    isDragging: () => false,
    getKeysForDrag: () => new Set<Key>(),
    draggedKey: null,
    draggingKeys: new Set<Key>(),
    getAllowedDropOperations: () => [],
    preview: null,
    isDisabled: false,
    startDrag: () => {},
    endDrag: () => {},
  } as DraggableCollectionState;
}

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
  /** Render function receiving drag/drop states and merged collection+keyboard props */
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

  // Proxy selectionManager to hide selection from react-aria's drag logic.
  // Without this, react-aria drags ALL selected items when any selected item
  // is grabbed (hardcoded in useDraggableCollectionState → internal getKeys).
  // The proxy intercepts `selectedKeys` and `isSelected` so every item looks
  // unselected for drag, while all other methods (isDisabled, setFocusedKey, …)
  // delegate to the real manager. `bind(target)` preserves `this` for methods
  // that live on the prototype chain.
  const dragSelectionManager = useMemo(
    () =>
      new Proxy(state.selectionManager, {
        get(target, prop) {
          if (prop === 'selectedKeys') return new Set<Key>();
          if (prop === 'isSelected') return () => false;
          const value = Reflect.get(target, prop);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      }),
    [state.selectionManager],
  );

  const dragState = useDraggableCollectionState({
    collection: state.collection,
    selectionManager: dragSelectionManager,
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

  // Force-cancel drag on Escape. Native HTML5 drag cancels visually, but some
  // browsers (Safari) don't fire `dragend` synchronously, leaving react-aria's
  // `isDragging` stale until a second keypress.
  const isDragActive = dragState.draggingKeys.size > 0;
  const endDragRef = useRef(dragState.endDrag);
  endDragRef.current = dragState.endDrag;

  useEffect(() => {
    if (!isDragActive) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        endDragRef.current();
      }
    };

    document.addEventListener('keydown', handleEscape, true);

    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isDragActive]);

  // Alt+Arrow keyboard shortcut for reordering.
  // Uses capture phase so we read focusedKey BEFORE react-aria moves focus.
  const handleKeyDownCapture = useEvent((e: KeyboardEvent) => {
    if (!e.altKey || !onReorder) return;

    const moveKeys =
      orientation === 'vertical'
        ? { backward: 'ArrowUp', forward: 'ArrowDown' }
        : { backward: 'ArrowLeft', forward: 'ArrowRight' };

    const direction =
      e.key === moveKeys.backward ? -1 : e.key === moveKeys.forward ? 1 : 0;

    if (direction === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const focusedKey = String(state.selectionManager.focusedKey);
    const idx = orderedKeys.indexOf(focusedKey);

    if (idx === -1) return;

    const targetIdx = idx + direction;

    if (targetIdx < 0 || targetIdx >= orderedKeys.length) return;

    const newKeys = [...orderedKeys];
    [newKeys[idx], newKeys[targetIdx]] = [newKeys[targetIdx], newKeys[idx]];
    onReorder(newKeys);
  });

  return children(
    dragState,
    dropState,
    mergeProps(collectionProps, { onKeyDownCapture: handleKeyDownCapture }),
  );
}
