import { tasty } from '@tenphi/tasty';
import { ReactNode } from 'react';

import {
  BoardDragActiveProvider,
  BoardRegistryContext,
  WidgetTransferInfo,
} from './board-context';
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
  /**
   * Fired when a widget is dropped from one board into another. Use it to move
   * the widget's `Board.Widget` declaration into the destination container when
   * the source container can unmount (e.g. an inactive `Tab`).
   */
  onWidgetTransfer?: (info: WidgetTransferInfo) => void;
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
  const { children, onWidgetTransfer } = props;
  const registry = useBoardRegistry({ onWidgetTransfer });

  return (
    <BoardRegistryContext.Provider value={registry}>
      <BoardDragActiveProvider isActive={registry.dragState != null}>
        {children}
        <OverlayElement ref={registry.overlayRef} aria-hidden="true" />
      </BoardDragActiveProvider>
    </BoardRegistryContext.Provider>
  );
}
