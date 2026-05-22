import { useEffect, useRef, useState } from 'react';
import { useDropIndicator } from 'react-aria';

import { DropIndicatorElement } from './styled';
import { useTabsContext } from './TabsContext';

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
 * Renders a bar showing where the dragged tab will be dropped. The bar is
 * vertical for horizontal Tabs (`placement: 'top' | 'bottom'`) and horizontal
 * for vertical Tabs (`placement: 'left' | 'right'`). Only visible when the
 * drop target is active.
 */
export function TabDropIndicator({
  target,
  dropState,
  position,
}: TabDropIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const { placement } = useTabsContext();

  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target },
    dropState,
    ref,
  );

  // Re-evaluate drop target registration when tab layout changes.
  // Active only while the indicator is rendered in the DOM (during drags).
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const tabList = element.closest('[data-element="TabList"]');
    if (!tabList) return;

    const observer = new ResizeObserver(() => {
      setTick((n) => n + 1);
    });

    observer.observe(tabList);

    return () => observer.disconnect();
  }, [isHidden]);

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
        placement,
      }}
    />
  );
}
