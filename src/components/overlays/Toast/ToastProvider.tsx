import {
  createContext,
  Key,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal';
import { tasty } from '../../../tasty';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';
import { Portal } from '../../portal';

import { ToastItem } from './ToastItem';

import type { InternalToast, ToastContextValue, ToastData } from './types';

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 3;
const COLLAPSE_VISIBLE_HEIGHT = 10;
const CONTAINER_OFFSET = 16; // Container's top offset from viewport (2x)

// Generate deduplication key from toast data
function generateDedupeKey(data: ToastData): string {
  const id = data.id;

  if (id != null) {
    return String(id);
  }

  // Hash based on title + description + theme
  const parts = [
    typeof data.title === 'string' ? data.title : '',
    typeof data.description === 'string' ? data.description : '',
    data.theme ?? 'default',
  ];

  return parts.join('|');
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }

  return context;
}

const TOAST_GAP = 8; // Gap between toasts in pixels

const ToastContainerElement = tasty({
  styles: {
    position: 'fixed',
    top: '2x',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10000,
    padding: '1x',
    height: '0',
    pointerEvents: 'none',
  },
});

const ToastWrapper = tasty({
  styles: {
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'max-content 50x',
    pointerEvents: 'auto',
    transition: 'top 0.3s, opacity 0.3s',
    opacity: {
      '': 0,
      isShown: 1,
    },
  },
});

interface ToastContainerProps {
  toasts: InternalToast[];
  onExitComplete: (internalId: string) => void;
}

// Default height used for initial positioning before measurement
const DEFAULT_TOAST_HEIGHT = 56;

function ToastContainer({ toasts, onExitComplete }: ToastContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const toastRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Track last known positions for exiting toasts to prevent animation to top: 0
  const lastPositionsRef = useRef<Map<string, number>>(new Map());

  // Calculate bounds from all toast elements
  const updateBounds = useCallback(() => {
    const refs = toastRefs.current;

    if (refs.size === 0) {
      boundsRef.current = null;

      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    refs.forEach((el) => {
      const rect = el.getBoundingClientRect();

      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    });

    // Use DOMRect if available (browser), otherwise create a plain object (test environment)
    if (typeof DOMRect !== 'undefined') {
      boundsRef.current = new DOMRect(minX, minY, maxX - minX, maxY - minY);
    } else {
      boundsRef.current = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        top: minY,
        right: maxX,
        bottom: maxY,
        left: minX,
        toJSON: () => ({}),
      } as DOMRect;
    }
  }, []);

  // Track mouse position to detect when it leaves toast area
  useEffect(() => {
    if (!isCollapsed) return;

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = boundsRef.current;

      if (!bounds) {
        setIsCollapsed(false);

        return;
      }

      // Add some padding to the bounds for smoother UX
      const padding = 20;
      const isInBounds =
        e.clientX >= bounds.left - padding &&
        e.clientX <= bounds.right + padding &&
        e.clientY >= bounds.top - padding &&
        e.clientY <= bounds.bottom + padding;

      if (!isInBounds) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isCollapsed]);

  // Update bounds when toasts change
  useEffect(() => {
    updateBounds();
  }, [toasts, updateBounds]);

  const handleMouseEnter = useCallback(() => {
    updateBounds();
    setIsCollapsed(true);
  }, [updateBounds]);

  // Measure heights after render using useEffect
  useEffect(() => {
    const newHeights: Record<string, number> = {};
    let hasChanges = false;

    toastRefs.current.forEach((el, id) => {
      const height = el.offsetHeight || DEFAULT_TOAST_HEIGHT;

      newHeights[id] = height;

      if (heights[id] !== height) {
        hasChanges = true;
      }
    });

    // Also check for removed toasts
    for (const id of Object.keys(heights)) {
      if (!toastRefs.current.has(id)) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setHeights(newHeights);
    }
  });

  // Create ref callback that stores refs without triggering updates
  const createRefCallback = useCallback(
    (internalId: string, displayRef: (el: HTMLElement | null) => void) =>
      (el: HTMLDivElement | null) => {
        displayRef(el);

        if (el) {
          toastRefs.current.set(internalId, el);
        } else {
          toastRefs.current.delete(internalId);
        }
      },
    [],
  );

  // Calculate top positions for visible (non-exiting) toasts
  const visibleToasts = toasts.filter((t) => !t.isExiting);

  const positions = useMemo(() => {
    const posMap = new Map<string, number>();
    let currentTop = 0;

    for (const toast of visibleToasts) {
      posMap.set(toast.internalId, currentTop);
      const height = heights[toast.internalId] ?? DEFAULT_TOAST_HEIGHT;

      currentTop += height + TOAST_GAP;
    }

    return posMap;
  }, [visibleToasts, heights]);

  // Update lastPositionsRef with current positions for visible toasts
  // This preserves positions for toasts that will exit later
  useEffect(() => {
    positions.forEach((pos, id) => {
      lastPositionsRef.current.set(id, pos);
    });
  }, [positions]);

  // Clean up lastPositionsRef when toast exit completes
  const handleExitComplete = useCallback(
    (internalId: string) => {
      lastPositionsRef.current.delete(internalId);
      onExitComplete(internalId);
    },
    [onExitComplete],
  );

  // Calculate collapsed positions
  const getToastStyle = useCallback(
    (toast: InternalToast, index: number, total: number) => {
      // Use current position for visible toasts, or last known position for exiting toasts
      const baseTop =
        positions.get(toast.internalId) ??
        lastPositionsRef.current.get(toast.internalId) ??
        0;
      const height = heights[toast.internalId] ?? DEFAULT_TOAST_HEIGHT;

      if (!isCollapsed) {
        return { top: `${baseTop}px` };
      }

      // In collapsed state, all toasts overlap completely
      // Only COLLAPSE_VISIBLE_HEIGHT of the toast should be visible from viewport top
      // Container is at CONTAINER_OFFSET from viewport, so we compensate for that
      const isNewest = index === total - 1;
      const collapsedTop = COLLAPSE_VISIBLE_HEIGHT - CONTAINER_OFFSET - height;

      return {
        top: `${collapsedTop}px`,
        zIndex: index, // Newest on top (highest index = highest z)
        opacity: isNewest ? 1 : 0,
        pointerEvents: 'none' as const,
      };
    },
    [isCollapsed, positions, heights],
  );

  if (toasts.length === 0) return null;

  return (
    <Portal>
      <ToastContainerElement ref={containerRef}>
        {toasts.map((toast) => {
          const visibleIndex = visibleToasts.findIndex(
            (t) => t.internalId === toast.internalId,
          );

          return (
            <DisplayTransition
              key={toast.internalId}
              animateOnMount
              isShown={!toast.isExiting}
              onRest={(transition) => {
                if (transition === 'exit') {
                  handleExitComplete(toast.internalId);
                }
              }}
            >
              {({ isShown, ref }) => (
                <ToastWrapper
                  ref={createRefCallback(toast.internalId, ref)}
                  mods={{ isShown }}
                  style={getToastStyle(
                    toast,
                    visibleIndex >= 0 ? visibleIndex : 0,
                    visibleToasts.length,
                  )}
                  onMouseEnter={handleMouseEnter}
                >
                  <ToastItem
                    {...toast.itemProps}
                    title={toast.title}
                    description={toast.description}
                    theme={toast.theme}
                    icon={toast.icon}
                    isLoading={toast.isLoading}
                  />
                </ToastWrapper>
              )}
            </DisplayTransition>
          );
        })}
      </ToastContainerElement>
    </Portal>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const idCounter = useRef(0);

  const generateId = useCallback(() => {
    idCounter.current += 1;

    return `toast-${idCounter.current}-${Date.now()}`;
  }, []);

  const clearTimer = useCallback((internalId: string) => {
    const timer = timersRef.current.get(internalId);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(internalId);
    }
  }, []);

  // Mark toast as exiting (triggers exit transition)
  const removeToast = useEvent((id: Key) => {
    setToasts((prev) => {
      const toast = prev.find(
        (t) => t.id === id || t.internalId === String(id),
      );

      if (toast) {
        clearTimer(toast.internalId);
      }

      // Mark as exiting instead of removing immediately
      return prev.map((t) => {
        if (t.id === id || t.internalId === String(id)) {
          return { ...t, isExiting: true };
        }

        return t;
      });
    });
  });

  // Actually remove the toast from the array after exit transition completes
  const finalizeRemoval = useEvent((internalId: string) => {
    setToasts((prev) => prev.filter((t) => t.internalId !== internalId));
  });

  const addToast = useEvent((data: ToastData, isProgress = false): Key => {
    const internalId = generateId();
    const dedupeKey = generateDedupeKey(data);
    const duration = isProgress ? null : data.duration ?? DEFAULT_DURATION;

    // Mark existing toast with same dedupe key as exiting
    setToasts((prev) => {
      const existingIndex = prev.findIndex(
        (t) => t.dedupeKey === dedupeKey && !t.isExiting,
      );

      if (existingIndex !== -1) {
        const existing = prev[existingIndex];

        clearTimer(existing.internalId);

        // Mark as exiting instead of removing immediately
        return prev.map((t, i) => {
          if (i === existingIndex) {
            return { ...t, isExiting: true };
          }

          return t;
        });
      }

      return prev;
    });

    const newToast: InternalToast = {
      ...data,
      internalId,
      isProgress,
      dedupeKey,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      let newToasts = [...prev, newToast];

      // Enforce max toasts limit (only count non-exiting toasts)
      const activeToasts = newToasts.filter((t) => !t.isExiting);
      const progressToasts = activeToasts.filter((t) => t.isProgress);
      const temporalToasts = activeToasts.filter((t) => !t.isProgress);

      // If we exceed limit, mark oldest temporal toasts as exiting
      while (activeToasts.length > MAX_TOASTS) {
        // Always allow at least 1 temporal toast even with 3 progress toasts
        if (temporalToasts.length > 1 || progressToasts.length < MAX_TOASTS) {
          const oldestTemporal = temporalToasts.shift();

          if (oldestTemporal) {
            clearTimer(oldestTemporal.internalId);
            newToasts = newToasts.map((t) => {
              if (t.internalId === oldestTemporal.internalId) {
                return { ...t, isExiting: true };
              }

              return t;
            });
            // Update activeToasts count
            const idx = activeToasts.findIndex(
              (t) => t.internalId === oldestTemporal.internalId,
            );

            if (idx !== -1) activeToasts.splice(idx, 1);
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return newToasts;
    });

    // Set auto-dismiss timer for non-progress toasts
    if (duration != null && duration > 0) {
      const timer = setTimeout(() => {
        removeToast(data.id ?? internalId);
      }, duration);

      timersRef.current.set(internalId, timer);
    }

    return data.id ?? internalId;
  });

  const updateToast = useEvent((id: Key, data: Partial<ToastData>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id || t.internalId === String(id)) {
          return { ...t, ...data };
        }

        return t;
      }),
    );
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      addToast,
      removeToast,
      updateToast,
      toasts,
    }),
    [addToast, removeToast, updateToast, toasts],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onExitComplete={finalizeRemoval} />
    </ToastContext.Provider>
  );
}
