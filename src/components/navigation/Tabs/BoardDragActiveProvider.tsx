import { createContext, ReactNode, useContext } from 'react';

/**
 * A stable boolean signalling whether a board widget is currently being
 * dragged. It only flips on drag start/end, so `Tabs` can subscribe without
 * re-rendering on every pointer move. Defaults to `false` outside any
 * `BoardDragActiveProvider`.
 */
const BoardDragActiveContext = createContext<boolean>(false);

export function useBoardDragActive(): boolean {
  return useContext(BoardDragActiveContext);
}

export interface CubeBoardDragActiveProviderProps {
  /** Whether a board-widget drag is in flight right now. */
  isActive: boolean;
  children?: ReactNode;
}

/**
 * Publishes "a board-widget drag is in flight" to the UI Kit components that
 * react to one — today `Tabs`, which spring-loads a tab when a dragged widget
 * hovers its header and keeps every panel mounted for the drag's duration so
 * the tab a widget is being pulled out of cannot unmount mid-gesture.
 *
 * The board itself lives outside this package (Cube Cloud owns it), so this is
 * its only way to reach `Tabs`. Wrap the subtree your board renders and pass
 * your own drag state:
 *
 * ```tsx
 * <BoardDragActiveProvider isActive={dragState != null}>{children}</BoardDragActiveProvider>
 * ```
 *
 * Nesting is last-one-wins, like any context: an inner board's `false` while an
 * outer board drags would read as "no drag" to the tabs inside it. Provide it
 * at the same level as your drag registry.
 */
export function BoardDragActiveProvider(
  props: CubeBoardDragActiveProviderProps,
) {
  const { isActive, children } = props;

  return (
    <BoardDragActiveContext.Provider value={isActive}>
      {children}
    </BoardDragActiveContext.Provider>
  );
}
