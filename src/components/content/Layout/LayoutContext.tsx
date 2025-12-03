import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Side = 'left' | 'top' | 'right' | 'bottom';

export interface LayoutContextValue {
  registerPanel: (side: Side, size: number) => void;
  unregisterPanel: (side: Side) => void;
  updatePanelSize: (side: Side, size: number) => void;
  setDragging: (isDragging: boolean) => void;
  markReady: () => void;
  panelSizes: Record<Side, number>;
  isDragging: boolean;
  isReady: boolean;
}

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext(): LayoutContextValue | null {
  return useContext(LayoutContext);
}

export interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const registeredPanels = useRef<Set<Side>>(new Set());
  const [panelSizes, setPanelSizes] = useState<Record<Side, number>>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const registerPanel = useCallback((side: Side, size: number) => {
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
    setPanelSizes((prev) => {
      if (prev[side] === size) return prev;
      return { ...prev, [side]: size };
    });
  }, []);

  const unregisterPanel = useCallback((side: Side) => {
    registeredPanels.current.delete(side);
    setPanelSizes((prev) => {
      if (prev[side] === 0) return prev;
      return { ...prev, [side]: 0 };
    });
  }, []);

  const updatePanelSize = useCallback((side: Side, size: number) => {
    setPanelSizes((prev) => {
      // Only update if the size actually changed
      if (prev[side] === size) return prev;
      return { ...prev, [side]: size };
    });
  }, []);

  const setDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const value = useMemo(
    () => ({
      registerPanel,
      unregisterPanel,
      updatePanelSize,
      setDragging,
      markReady,
      panelSizes,
      isDragging,
      isReady,
    }),
    [
      registerPanel,
      unregisterPanel,
      updatePanelSize,
      setDragging,
      markReady,
      panelSizes,
      isDragging,
      isReady,
    ],
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

/**
 * Provider that resets the layout context for sub-components.
 * Used to prevent panels in nested Layouts from affecting parent layouts.
 */
export function LayoutContextReset({ children }: { children: ReactNode }) {
  return (
    <LayoutContext.Provider value={null}>{children}</LayoutContext.Provider>
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
