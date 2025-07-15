import { useSyncExternalStore } from 'react';

import { useEvent } from '../../_internal/hooks/use-event';

/** Like React.setState: either a value or a function of the previous value */
type Updater<S> = S | ((prev: S) => S);

/* Internal shape kept on globalThis */
interface StoreHolder<S> {
  state: S;
  listeners: Set<() => void>;
}

/**
 * Create a shared store that survives hot-reloads.
 *
 * Pass a unique `name` once per logical store module:
 *   export const useSidebarStore = createSharedStore('sidebar', { open: false });
 */
export function createSharedStore<S>(
  name: string,
  initialState: S,
): UseSharedStoreHook<S> {
  const cacheKey = `__sharedStore_${name}__`;
  const existing: StoreHolder<S> | undefined =
    cacheKey && (globalThis as any)[cacheKey];

  const holder: StoreHolder<S> = existing ?? {
    state: initialState,
    listeners: new Set<() => void>(),
  };

  /* Warn if someone tries to “re-initialise” with a different value */
  if (
    process.env.NODE_ENV === 'development' &&
    existing &&
    existing.state !== initialState
  ) {
    console.warn(
      `[createSharedStore] Store "${name}" already exists – ` +
        'the new initialState is ignored to preserve hot-reload state.',
    );
  }

  if (cacheKey && !existing) {
    (globalThis as any)[cacheKey] = holder;
  }

  const getSnapshot = () => holder.state;

  const subscribe = (cb: () => void) => {
    holder.listeners.add(cb);

    return () => holder.listeners.delete(cb);
  };

  const setStore = (update: Updater<S>) => {
    holder.state =
      typeof update === 'function'
        ? (update as (prev: S) => S)(holder.state)
        : update;

    holder.listeners.forEach((l) => l());
  };

  const useSharedStore: UseSharedStoreHook<S> = () => {
    return [useSyncExternalStore(subscribe, getSnapshot), useEvent(setStore)];
  };

  return useSharedStore;
}

type UseSharedStoreHook<S> = () => readonly [S, (u: Updater<S>) => void];
