import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks';

export type Side = 'left' | 'top' | 'right' | 'bottom';

/**
 * Refs context - stable refs that don't change and don't trigger re-renders.
 * Provides portal container ref for panels to render into.
 */
export interface LayoutRefsContextValue {
  /** Container element ref for panels to portal into */
  panelContainerRef: MutableRefObject<HTMLDivElement | null>;
}

export const LayoutRefsContext = createContext<LayoutRefsContextValue | null>(
  null,
);

export function useLayoutRefsContext(): LayoutRefsContextValue | null {
  return useContext(LayoutRefsContext);
}

/** Callback to dismiss an overlay panel */
export type OverlayDismissCallback = () => void;

/**
 * Actions context - stable functions and configuration that don't change.
 * Separating these from state prevents unnecessary re-renders when only state changes.
 */
export interface LayoutActionsContextValue {
  /** Register a panel on a specific side with initial size */
  registerPanel: (side: Side, size: number) => void;
  /** Unregister a panel from a specific side */
  unregisterPanel: (side: Side) => void;
  /** Update the size of a registered panel */
  updatePanelSize: (side: Side, size: number) => void;
  /** Set global dragging state (when any panel is being resized) */
  setDragging: (isDragging: boolean) => void;
  /** Mark the layout as ready (after initial mount) */
  markReady: () => void;
  /** Register an overlay panel's dismiss callback. Returns unregister function. */
  registerOverlayPanel: (dismiss: OverlayDismissCallback) => () => void;
  /** Dismiss all overlay panels */
  dismissOverlayPanels: () => void;
  /** Whether transitions are enabled for panels (stable config value) */
  hasTransition: boolean;
}

/** State context - reactive state that triggers re-renders */
export interface LayoutStateContextValue {
  panelSizes: Record<Side, number>;
  isDragging: boolean;
  isReady: boolean;
  hasOverlayPanels: boolean;
}

export const LayoutActionsContext =
  createContext<LayoutActionsContextValue | null>(null);
export const LayoutStateContext = createContext<LayoutStateContextValue | null>(
  null,
);

export function useLayoutActionsContext(): LayoutActionsContextValue | null {
  return useContext(LayoutActionsContext);
}

export function useLayoutStateContext(): LayoutStateContextValue | null {
  return useContext(LayoutStateContext);
}

export interface LayoutProviderProps {
  children: ReactNode;
  /** Whether transitions are enabled for panels */
  hasTransition?: boolean;
}

export function LayoutProvider({
  children,
  hasTransition = false,
}: LayoutProviderProps) {
  const registeredPanels = useRef<Set<Side>>(new Set());
  const overlayPanelCallbacks = useRef<Set<OverlayDismissCallback>>(new Set());
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  const [panelSizes, setPanelSizes] = useState<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasOverlayPanels, setHasOverlayPanels] = useState(false);

  const updatePanelSize = useEvent((side: Side, size: number) => {
    setPanelSizes((prev) => {
      if (prev[side] === size) return prev;
      return { ...prev, [side]: size };
    });
  });

  const registerPanel = useEvent((side: Side, size: number) => {
    if (registeredPanels.current.has(side)) {
      throw new Error(
        `Layout: Only one panel per side is allowed. ` +
          `A panel is already registered on the "${side}" side.`,
      );
    }

    // Check for axis conflict
    const isHorizontal = side === 'left' || side === 'right';
    const conflictingSides: Side[] = isHorizontal
      ? ['top', 'bottom']
      : ['left', 'right'];

    for (const conflictSide of conflictingSides) {
      if (registeredPanels.current.has(conflictSide)) {
        throw new Error(
          `Layout: Panels from different axes cannot be combined. ` +
            `Cannot register "${side}" panel when "${conflictSide}" panel exists. ` +
            `Use either horizontal (left/right) or vertical (top/bottom) panels.`,
        );
      }
    }

    registeredPanels.current.add(side);
    updatePanelSize(side, size);
  });

  const unregisterPanel = useEvent((side: Side) => {
    registeredPanels.current.delete(side);
    updatePanelSize(side, 0);
  });

  const setDragging = useEvent((dragging: boolean) => {
    setIsDragging(dragging);
  });

  const markReady = useEvent(() => {
    setIsReady(true);
  });

  const registerOverlayPanel = useEvent((dismiss: OverlayDismissCallback) => {
    overlayPanelCallbacks.current.add(dismiss);
    setHasOverlayPanels(true);

    // Return unregister function
    return () => {
      overlayPanelCallbacks.current.delete(dismiss);
      setHasOverlayPanels(overlayPanelCallbacks.current.size > 0);
    };
  });

  const dismissOverlayPanels = useEvent(() => {
    overlayPanelCallbacks.current.forEach((dismiss) => dismiss());
  });

  // Actions context - stable because all callbacks use useEvent
  const actionsValue = useMemo(
    () => ({
      registerPanel,
      unregisterPanel,
      updatePanelSize,
      setDragging,
      markReady,
      hasTransition,
      registerOverlayPanel,
      dismissOverlayPanels,
    }),
    // Only hasTransition can change - all other values are stable useEvent callbacks
    [hasTransition],
  );

  // State context - changes when state updates
  const stateValue = useMemo(
    () => ({
      panelSizes,
      isDragging,
      isReady,
      hasOverlayPanels,
    }),
    [panelSizes, isDragging, isReady, hasOverlayPanels],
  );

  // Refs context - stable refs that never change
  const refsValue = useMemo(
    () => ({
      panelContainerRef,
    }),
    [],
  );

  return (
    <LayoutRefsContext.Provider value={refsValue}>
      <LayoutActionsContext.Provider value={actionsValue}>
        <LayoutStateContext.Provider value={stateValue}>
          {children}
        </LayoutStateContext.Provider>
      </LayoutActionsContext.Provider>
    </LayoutRefsContext.Provider>
  );
}

/**
 * Provider that resets the layout context for sub-components.
 * Used to prevent panels in nested Layouts from affecting parent layouts.
 */
export function LayoutContextReset({ children }: { children: ReactNode }) {
  return (
    <LayoutRefsContext.Provider value={null}>
      <LayoutActionsContext.Provider value={null}>
        <LayoutStateContext.Provider value={null}>
          {children}
        </LayoutStateContext.Provider>
      </LayoutActionsContext.Provider>
    </LayoutRefsContext.Provider>
  );
}

// Panel context - provides panel-level callbacks to child components
export interface LayoutPanelContextValue {
  /** Callback to change the panel's open state */
  onOpenChange: (isOpen: boolean) => void;
  /** Current open state of the panel */
  isOpen: boolean;
}

export const LayoutPanelContext = createContext<LayoutPanelContextValue | null>(
  null,
);

export function useLayoutPanelContext(): LayoutPanelContextValue | null {
  return useContext(LayoutPanelContext);
}
