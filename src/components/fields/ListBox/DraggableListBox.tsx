import { ReactNode, RefObject } from 'react';
import {
  DraggableCollectionState,
  DroppableCollectionState,
  ListState,
} from 'react-stately';

import { DraggableCollection } from '../../shared/DraggableCollection';

// =============================================================================
// Types
// =============================================================================

export interface DraggableListBoxProps {
  /** List state from React Stately (useListState) */
  state: Pick<
    ListState<any>,
    'collection' | 'selectionManager' | 'disabledKeys'
  >;
  /** Ref to the list container element */
  listRef: RefObject<HTMLElement | null>;
  /** Current ordered keys */
  orderedKeys: string[];
  /** Callback when items are reordered */
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
 * Wrapper that enables drag-and-drop reordering for a vertical ListBox.
 *
 * Thin wrapper around DraggableCollection with vertical orientation.
 */
export function DraggableListBox({
  state,
  listRef,
  orderedKeys,
  onReorder,
  children,
}: DraggableListBoxProps) {
  return (
    <DraggableCollection
      state={state}
      listRef={listRef}
      orderedKeys={orderedKeys}
      orientation="vertical"
      onReorder={onReorder}
    >
      {children}
    </DraggableCollection>
  );
}
