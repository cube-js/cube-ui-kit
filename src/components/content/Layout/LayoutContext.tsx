import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { useEvent } from '../../../_internal/hooks';

export type Side = 'left' | 'top' | 'right' | 'bottom';

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
  /** Subscribe to panel sizes changes (for useSyncExternalStore) */
  subscribeToPanelSizes: (callback: () => void) => () => void;
  /** Get current panel sizes snapshot (for useSyncExternalStore) */
  getPanelSizes: () => Record<Side, number>;
}

/** State context - reactive state that triggers re-renders */
export interface LayoutStateContextValue {
  panelSizes: Record<Side, number>;
  isDragging: boolean;
  isReady: boolean;
  hasOverlayPanels: boolean;
}

/**
 * Combined context value for backwards compatibility.
 * @deprecated Use useLayoutActionsContext and useLayoutStateContext separately
 * for better performance - using this combined context will cause re-renders
 * whenever any state changes.
 */
export interface LayoutContextValue
  extends LayoutActionsContextValue,
    LayoutStateContextValue {}

export const LayoutActionsContext =
  createContext<LayoutActionsContextValue | null>(null);
export const LayoutStateContext = createContext<LayoutStateContextValue | null>(
  null,
);

/** @deprecated Use useLayoutActionsContext and useLayoutStateContext separately */
export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutActionsContext(): LayoutActionsContextValue | null {
  return useContext(LayoutActionsContext);
}

export function useLayoutStateContext(): LayoutStateContextValue | null {
  return useContext(LayoutStateContext);
}

export function useLayoutContext(): LayoutContextValue | null {
  return useContext(LayoutContext);
}

// Default panel sizes - hoisted for referential stability with useSyncExternalStore
const DEFAULT_PANEL_SIZES: Record<Side, number> = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};
const noopSubscribe = () => () => {};
const getDefaultPanelSizes = () => DEFAULT_PANEL_SIZES;

/**
 * Hook to get panel sizes without causing re-renders on every size change.
 * Uses useSyncExternalStore for efficient subscriptions.
 */
export function usePanelSizes(): Record<Side, number> {
  const actions = useLayoutActionsContext();

  return useSyncExternalStore(
    actions?.subscribeToPanelSizes ?? noopSubscribe,
    actions?.getPanelSizes ?? getDefaultPanelSizes,
    getDefaultPanelSizes,
  );
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

  /**
   * Panel sizes are stored in both a ref and state:
   * - panelSizesRef: For useSyncExternalStore (usePanelSizes hook) - allows
   *   consumers to subscribe to size changes without causing re-renders in the
   *   entire Layout tree.
   * - panelSizes state: For the Layout component to re-render and adjust content
   *   area when panel sizes change.
   *
   * Both are kept in sync by updating them together in register/unregister/update.
   */
  const panelSizesRef = useRef<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const panelSizesSubscribers = useRef<Set<() => void>>(new Set());

  const [panelSizes, setPanelSizes] = useState<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasOverlayPanels, setHasOverlayPanels] = useState(false);

  // Helper to update both ref and state in sync
  const updatePanelSizeInternal = (side: Side, size: number) => {
    // Update ref immediately for synchronous access via useSyncExternalStore
    if (panelSizesRef.current[side] !== size) {
      panelSizesRef.current = { ...panelSizesRef.current, [side]: size };
      // Notify useSyncExternalStore subscribers
      panelSizesSubscribers.current.forEach((callback) => callback());
    }

    // Update state for Layout component re-renders
    setPanelSizes((prev) => {
      if (prev[side] === size) return prev;
      return { ...prev, [side]: size };
    });
  };

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
    updatePanelSizeInternal(side, size);
  });

  const unregisterPanel = useEvent((side: Side) => {
    registeredPanels.current.delete(side);
    updatePanelSizeInternal(side, 0);
  });

  const updatePanelSize = useEvent((side: Side, size: number) => {
    updatePanelSizeInternal(side, size);
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

  const subscribeToPanelSizes = useEvent((callback: () => void) => {
    panelSizesSubscribers.current.add(callback);
    return () => {
      panelSizesSubscribers.current.delete(callback);
    };
  });

  const getPanelSizes = useEvent(() => panelSizesRef.current);

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
      subscribeToPanelSizes,
      getPanelSizes,
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

  // Combined value for backwards compatibility
  const combinedValue = useMemo(
    () => ({
      ...actionsValue,
      ...stateValue,
    }),
    [actionsValue, stateValue],
  );

  return (
    <LayoutActionsContext.Provider value={actionsValue}>
      <LayoutStateContext.Provider value={stateValue}>
        <LayoutContext.Provider value={combinedValue}>
          {children}
        </LayoutContext.Provider>
      </LayoutStateContext.Provider>
    </LayoutActionsContext.Provider>
  );
}

/**
 * Provider that resets the layout context for sub-components.
 * Used to prevent panels in nested Layouts from affecting parent layouts.
 */
export function LayoutContextReset({ children }: { children: ReactNode }) {
  return (
    <LayoutActionsContext.Provider value={null}>
      <LayoutStateContext.Provider value={null}>
        <LayoutContext.Provider value={null}>{children}</LayoutContext.Provider>
      </LayoutStateContext.Provider>
    </LayoutActionsContext.Provider>
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
