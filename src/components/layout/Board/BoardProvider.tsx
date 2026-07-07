import { tasty } from '@tenphi/tasty';
import { ReactNode } from 'react';

import { BoardRegistryContext } from './board-context';
import { useBoardRegistry } from './use-board-registry';

const OverlayElement = tasty({
  qa: 'BoardDragOverlay',
  styles: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    pointerEvents: 'none',
    overflow: 'visible',
  },
});

export interface CubeBoardProviderProps {
  children?: ReactNode;
}

/**
 * Shares a single drag context across multiple `Board`s so widgets can be
 * dragged from one board to another (including out of a nested board into its
 * parent). Also hosts the fixed drag overlay used to render the dragged widget
 * above everything, so ancestor `overflow: hidden` never clips it.
 *
 * A standalone `Board` provides its own registry automatically; wrap several
 * boards in a `BoardProvider` only when you need cross-board dragging.
 */
export function BoardProvider(props: CubeBoardProviderProps) {
  const { children } = props;
  const registry = useBoardRegistry();

  return (
    <BoardRegistryContext.Provider value={registry}>
      {children}
      <OverlayElement ref={registry.overlayRef} aria-hidden="true" />
    </BoardRegistryContext.Provider>
  );
}
