import { useRef } from 'react';
import { useDropIndicator } from 'react-aria';

import { DropIndicatorElement } from './styled';

import type { DropTarget } from 'react-aria';
import type { DroppableCollectionState } from 'react-stately';

// =============================================================================
// Types
// =============================================================================

export interface TabDropIndicatorProps {
  /** Drop target configuration */
  target: DropTarget;
  /** Droppable collection state from React Aria */
  dropState: DroppableCollectionState;
  /** Position of the indicator (before or after the tab) */
  position: 'before' | 'after';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Visual drop indicator for drag-and-drop tab reordering.
 *
 * Renders a vertical line showing where the dragged tab will be dropped.
 * Only visible when the drop target is active.
 */
export function TabDropIndicator({
  target,
  dropState,
  position,
}: TabDropIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target },
    dropState,
    ref,
  );

  if (isHidden) {
    return null;
  }

  return (
    <DropIndicatorElement
      ref={ref}
      role="option"
      {...dropIndicatorProps}
      mods={{
        'drop-target': isDropTarget,
        after: position === 'after',
        before: position === 'before',
      }}
    />
  );
}
