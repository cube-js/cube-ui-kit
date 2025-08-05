import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

export type EventBusListener<T = any> = (data: T) => void;

export interface EventBusContextValue {
  emit: <T = any>(event: string, data?: T) => void;
  on: <T = any>(event: string, listener: EventBusListener<T>) => () => void;
  off: <T = any>(event: string, listener: EventBusListener<T>) => void;
}

const EventBusContext = createContext<EventBusContextValue | null>(null);

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

  const emit = useCallback(<T = any>(event: string, data?: T) => {
    // Use setTimeout to ensure async emission after current render cycle
    setTimeout(() => {
      const eventListeners = listeners.current[event];
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(data));
      }
    }, 0);
  }, []);

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

  const contextValue: EventBusContextValue = {
    emit,
    on,
    off,
  };

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
 *   const { emit, on } = useEventBus();
 *
 *   const handleClick = () => {
 *     emit('user-action', { type: 'click', target: 'button' });
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
 *   return <button onClick={handleClick}>Click me</button>;
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
