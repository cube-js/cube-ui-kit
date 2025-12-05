import { useCallback, useSyncExternalStore } from 'react';

import { useEvent } from '../../_internal/hooks/use-event';

/** Like React.setState: either a value or a function of the previous value */
type Updater<T> = T | ((prev: T) => T);

/** Global registry of listeners per key for same-tab cross-instance sync */
const listeners = new Map<string, Set<() => void>>();

/** Notify all listeners for a given key */
function notifyListeners(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

/** Check if localStorage is available */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** Safely parse JSON with fallback */
function parseJSON<T>(value: string | null, fallback: T): T {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Get initial value, supporting lazy initializer */
function getInitialValue<T>(initialValue: T | (() => T)): T {
  return typeof initialValue === 'function'
    ? (initialValue as () => T)()
    : initialValue;
}

/**
 * A hook to persist state in localStorage with cross-instance synchronization.
 *
 * Features:
 * - JSON serialization/deserialization
 * - Syncs between hook instances with the same key (same tab)
 * - Syncs across browser tabs via storage event
 * - SSR-safe (gracefully handles missing localStorage)
 * - Supports lazy initial value
 *
 * @param key - The localStorage key. Pass `null` or `undefined` to disable the hook.
 * @param initialValue - Initial value or lazy initializer function
 * @returns Tuple of [value, setValue] similar to useState
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // With lazy initializer
 * const [settings, setSettings] = useLocalStorage('settings', () => getDefaultSettings());
 *
 * // Disabled (returns initialValue, setValue is no-op)
 * const [value, setValue] = useLocalStorage(null, 'default');
 *
 * // Conditionally enabled
 * const [data, setData] = useLocalStorage(isEnabled ? 'my-key' : null, {});
 * ```
 */
export function useLocalStorage<T>(
  key: string | null | undefined,
  initialValue: T | (() => T),
): readonly [T, (value: Updater<T>) => void] {
  const resolvedInitial = getInitialValue(initialValue);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!key) {
        return () => {};
      }

      // Add to same-tab listeners
      if (!listeners.has(key)) {
        listeners.set(key, new Set());
      }
      listeners.get(key)!.add(onStoreChange);

      // Listen for cross-tab changes
      const handleStorageEvent = (event: StorageEvent) => {
        if (event.key === key) {
          onStoreChange();
        }
      };
      window.addEventListener('storage', handleStorageEvent);

      return () => {
        listeners.get(key)?.delete(onStoreChange);
        if (listeners.get(key)?.size === 0) {
          listeners.delete(key);
        }
        window.removeEventListener('storage', handleStorageEvent);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    if (!key || !isLocalStorageAvailable()) {
      return resolvedInitial;
    }

    return parseJSON(localStorage.getItem(key), resolvedInitial);
  }, [key, resolvedInitial]);

  const getServerSnapshot = useCallback((): T => {
    return resolvedInitial;
  }, [resolvedInitial]);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useEvent((update: Updater<T>) => {
    if (!key || !isLocalStorageAvailable()) {
      return;
    }

    const currentValue = parseJSON<T>(
      localStorage.getItem(key),
      resolvedInitial,
    );
    const newValue =
      typeof update === 'function'
        ? (update as (prev: T) => T)(currentValue)
        : update;

    try {
      localStorage.setItem(key, JSON.stringify(newValue));
      notifyListeners(key);
    } catch (error) {
      console.error(`[useLocalStorage] Failed to save "${key}":`, error);
    }
  });

  return [storedValue, setValue] as const;
}
