import { ReactNode, RefObject } from 'react';
import {
  DraggableCollectionState,
  DroppableCollectionState,
  TabListState,
} from 'react-stately';

import { DraggableCollection } from '../../shared/DraggableCollection';

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
  /**
   * Orientation of the underlying DraggableCollection.
   * Driven by the parent Tabs `placement`.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
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
 * Thin wrapper around DraggableCollection. The `orientation` prop should be
 * derived from the parent Tabs `placement` so drag math/visuals match the
 * visible axis (horizontal for `top`/`bottom`, vertical for `left`/`right`).
 */
export function DraggableTabList({
  state,
  listRef,
  orderedKeys,
  orientation = 'horizontal',
  onReorder,
  children,
}: DraggableTabListProps) {
  return (
    <DraggableCollection
      state={state}
      listRef={listRef}
      orderedKeys={orderedKeys}
      orientation={orientation}
      onReorder={onReorder}
    >
      {children}
    </DraggableCollection>
  );
}
