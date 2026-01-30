import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

export type Side = 'left' | 'top' | 'right' | 'bottom';

/** Callback to dismiss an overlay panel */
export type OverlayDismissCallback = () => void;

/** Actions context - stable functions that don't change */
export interface LayoutActionsContextValue {
  registerPanel: (side: Side, size: number) => void;
  unregisterPanel: (side: Side) => void;
  updatePanelSize: (side: Side, size: number) => void;
  setDragging: (isDragging: boolean) => void;
  markReady: () => void;
  /** Register an overlay panel's dismiss callback. Returns unregister function. */
  registerOverlayPanel: (dismiss: OverlayDismissCallback) => () => void;
  /** Dismiss all overlay panels */
  dismissOverlayPanels: () => void;
  /** Whether transitions are enabled for panels */
  hasTransition: boolean;
  /** Subscribe to panel sizes changes (for useSyncExternalStore) */
  subscribeToPanelSizes: (callback: () => void) => () => void;
  /** Get current panel sizes snapshot */
  getPanelSizes: () => Record<Side, number>;
}

/** State context - reactive state that triggers re-renders */
export interface LayoutStateContextValue {
  panelSizes: Record<Side, number>;
  isDragging: boolean;
  isReady: boolean;
  hasOverlayPanels: boolean;
}

/** Combined context value for backwards compatibility */
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

/**
 * Hook to get panel sizes without causing re-renders on every size change.
 * Uses useSyncExternalStore for efficient subscriptions.
 */
export function usePanelSizes(): Record<Side, number> {
  const actions = useLayoutActionsContext();

  const defaultSizes = { left: 0, top: 0, right: 0, bottom: 0 };

  return useSyncExternalStore(
    actions?.subscribeToPanelSizes ?? (() => () => {}),
    actions?.getPanelSizes ?? (() => defaultSizes),
    () => defaultSizes,
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

  // Use ref for panel sizes to avoid re-renders in Panels when sizes change
  const panelSizesRef = useRef<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const panelSizesSubscribers = useRef<Set<() => void>>(new Set());

  // State for values that need to trigger re-renders
  const [panelSizes, setPanelSizes] = useState<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasOverlayPanels, setHasOverlayPanels] = useState(false);

  // Notify subscribers when panel sizes change
  const notifyPanelSizesSubscribers = useCallback(() => {
    panelSizesSubscribers.current.forEach((callback) => callback());
  }, []);

  const registerPanel = useCallback(
    (side: Side, size: number) => {
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

      // Update ref immediately for synchronous access
      if (panelSizesRef.current[side] !== size) {
        panelSizesRef.current = { ...panelSizesRef.current, [side]: size };
        notifyPanelSizesSubscribers();
      }

      // Also update state for Layout component re-renders
      setPanelSizes((prev) => {
        if (prev[side] === size) return prev;
        return { ...prev, [side]: size };
      });
    },
    [notifyPanelSizesSubscribers],
  );

  const unregisterPanel = useCallback(
    (side: Side) => {
      registeredPanels.current.delete(side);

      // Update ref immediately
      if (panelSizesRef.current[side] !== 0) {
        panelSizesRef.current = { ...panelSizesRef.current, [side]: 0 };
        notifyPanelSizesSubscribers();
      }

      setPanelSizes((prev) => {
        if (prev[side] === 0) return prev;
        return { ...prev, [side]: 0 };
      });
    },
    [notifyPanelSizesSubscribers],
  );

  const updatePanelSize = useCallback(
    (side: Side, size: number) => {
      // Update ref immediately
      if (panelSizesRef.current[side] !== size) {
        panelSizesRef.current = { ...panelSizesRef.current, [side]: size };
        notifyPanelSizesSubscribers();
      }

      setPanelSizes((prev) => {
        // Only update if the size actually changed
        if (prev[side] === size) return prev;
        return { ...prev, [side]: size };
      });
    },
    [notifyPanelSizesSubscribers],
  );

  const setDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  // Register an overlay panel's dismiss callback
  const registerOverlayPanel = useCallback(
    (dismiss: OverlayDismissCallback) => {
      overlayPanelCallbacks.current.add(dismiss);
      setHasOverlayPanels(true);

      // Return unregister function
      return () => {
        overlayPanelCallbacks.current.delete(dismiss);
        setHasOverlayPanels(overlayPanelCallbacks.current.size > 0);
      };
    },
    [],
  );

  // Dismiss all overlay panels
  const dismissOverlayPanels = useCallback(() => {
    overlayPanelCallbacks.current.forEach((dismiss) => dismiss());
  }, []);

  // Subscribe to panel sizes changes (for useSyncExternalStore)
  const subscribeToPanelSizes = useCallback((callback: () => void) => {
    panelSizesSubscribers.current.add(callback);
    return () => {
      panelSizesSubscribers.current.delete(callback);
    };
  }, []);

  // Get current panel sizes snapshot
  const getPanelSizes = useCallback(() => panelSizesRef.current, []);

  // Actions context - stable, doesn't change
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
    [
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
    ],
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
