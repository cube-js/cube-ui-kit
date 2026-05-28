import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

export type EventBusListener<T = any> = (data: T) => void;

export interface EventBusContextValue {
  emit: <T = any>(event: string, data?: T) => void;
  emitSync: <T = any>(event: string, data?: T) => void;
  on: <T = any>(event: string, listener: EventBusListener<T>) => () => void;
  off: <T = any>(event: string, listener: EventBusListener<T>) => void;
}

export const EventBusContext = createContext<EventBusContextValue | null>(null);

export interface EventBusProviderProps {
  children: ReactNode;
}

/**
 * EventBusProvider provides a global event system for the application.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <EventBusProvider>
 *       <YourComponents />
 *     </EventBusProvider>
 *   );
 * }
 * ```
 */
export function EventBusProvider({ children }: EventBusProviderProps) {
  // If we're already inside a parent EventBusProvider (e.g. the global Root
  // one), DO NOT create a fresh bus — that would isolate listeners and
  // emitters across the boundary. This matters because overlays (Popover,
  // Modal, Tray) re-wrap their content with our `Provider` from
  // `provider.tsx`, which transparently nests an EventBusProvider. Cross-
  // overlay events such as `popover:dismiss-ancestor` (a Button inside a
  // popover footer dismissing the popover host) only work when both sides
  // share the same bus.
  const parentBus = useContext(EventBusContext);

  const listeners = useRef<Record<string, EventBusListener[]>>({});

  const off = useCallback(
    <T = any>(event: string, listener: EventBusListener<T>) => {
      const eventListeners = listeners.current[event];
      if (eventListeners) {
        listeners.current[event] = eventListeners.filter((l) => l !== listener);

        // Clean up empty event arrays
        if (listeners.current[event].length === 0) {
          delete listeners.current[event];
        }
      }
    },
    [],
  );

  const emitSync = useCallback(<T = any>(event: string, data?: T) => {
    const eventListeners = listeners.current[event];
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }, []);

  const emit = useCallback(
    <T = any>(event: string, data?: T) => {
      setTimeout(() => {
        emitSync(event, data);
      }, 0);
    },
    [emitSync],
  );

  const on = useCallback(
    <T = any>(event: string, listener: EventBusListener<T>) => {
      if (!listeners.current[event]) {
        listeners.current[event] = [];
      }
      listeners.current[event].push(listener);

      // Return cleanup function
      return () => {
        off(event, listener);
      };
    },
    [off],
  );

  // Always compute the local contextValue so hook order stays stable, then
  // pick parent OR local. `useMemo` keeps the local value referentially
  // stable across renders — every consumer of `EventBusContext` (notably
  // `useDismissParentPopover` inside every `Button` / `ItemButton`) would
  // otherwise re-render on every render of this provider.
  const localContextValue = useMemo<EventBusContextValue>(
    () => ({ emit, emitSync, on, off }),
    [emit, emitSync, on, off],
  );

  const contextValue = parentBus ?? localContextValue;

  return React.createElement(
    EventBusContext.Provider,
    { value: contextValue },
    children,
  );
}

/**
 * Hook to access the event bus functionality.
 * Must be used within an EventBusProvider.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { emit, emitSync, on } = useEventBus();
 *
 *   const handleClick = () => {
 *     emit('user-action', { type: 'click', target: 'button' });
 *   };
 *
 *   const handleSyncAction = () => {
 *     emitSync('sync-action', { immediate: true });
 *   };
 *
 *   useEffect(() => {
 *     const unsubscribe = on('data-updated', (data) => {
 *       console.log('Data updated:', data);
 *     });
 *
 *     return unsubscribe;
 *   }, [on]);
 *
 *   return (
 *     <div>
 *       <button onClick={handleClick}>Async Event</button>
 *       <button onClick={handleSyncAction}>Sync Event</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEventBus(): EventBusContextValue {
  const context = useContext(EventBusContext);

  if (!context) {
    throw new Error('useEventBus must be used within an EventBusProvider');
  }

  return context;
}

/**
 * Convenience hook for subscribing to events with automatic cleanup.
 * The listener will be automatically unsubscribed when the component unmounts
 * or when the dependencies change.
 *
 * @param event - The event name to listen for
 * @param listener - The callback function to execute when the event is emitted
 * @param deps - Dependency array for the effect (similar to useEffect)
 *
 * @example
 * ```tsx
 * function NotificationComponent() {
 *   const [message, setMessage] = useState('');
 *
 *   useEventListener('notification', (data) => {
 *     setMessage(data.message);
 *   }, []);
 *
 *   return <div>{message}</div>;
 * }
 * ```
 */
export function useEventListener<T = any>(
  event: string,
  listener: EventBusListener<T>,
  deps: React.DependencyList = [],
) {
  const { on } = useEventBus();

  useEffect(() => {
    const unsubscribe = on(event, listener);
    return unsubscribe;
  }, [event, on, ...deps]);
}
