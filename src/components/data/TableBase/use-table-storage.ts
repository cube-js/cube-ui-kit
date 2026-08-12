import { useCallback, useRef, useState } from 'react';

import type { CubeTableSort } from './types';

/**
 * Namespaced so a `storageKey` cannot collide with whatever else the host app
 * keeps in `localStorage`, and so the kit's own stored shape can be migrated or
 * cleared as a group later.
 */
const PREFIX = 'cube-ui-kit:table:';

export type CubeTablePersistKey =
  | 'pageSize'
  | 'columnWidths'
  | 'columnOrder'
  | 'sort';

export interface CubeTableStoredState {
  pageSize?: number;
  sort?: CubeTableSort | null;
  columnWidths?: Record<string, number>;
  /** Every column key in order, including hidden and pinned ones. */
  columnOrder?: string[];
}

export const DEFAULT_PERSIST_KEYS: CubeTablePersistKey[] = [
  'pageSize',
  'columnWidths',
  // A column layout the user arranged by hand is the same kind of state as the
  // widths they dragged — losing it on reload would be as surprising.
  'columnOrder',
];

function read(storageKey: string | undefined): CubeTableStoredState {
  // No `storageKey` means the feature is off; no `window` means SSR. Both are
  // normal, not errors.
  if (!storageKey || typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(PREFIX + storageKey);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    // Anything could be under that key — a hand-edited value, a stale shape
    // from an older version. A non-object is simply ignored.
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // Private mode, a disabled store, or malformed JSON. Persistence is a
    // convenience; losing it must never take the table down with it.
    return {};
  }
}

/**
 * Persists the parts of the table's own state that a user expects to survive a
 * reload. Only state the table *owns* is stored: a controlled `pageSize` or
 * `sort` belongs to the page, so restoring it would fight the page's own source
 * of truth.
 *
 * Returns the state read at mount — a one-shot snapshot, deliberately, so a
 * second table sharing the key cannot yank this one's page size mid-session.
 */
export function useTableStorage(
  storageKey: string | undefined,
  persist: CubeTablePersistKey[] = DEFAULT_PERSIST_KEYS,
) {
  const [initial] = useState(() => read(storageKey));
  const persistRef = useRef(persist);

  persistRef.current = persist;

  const write = useCallback(
    (patch: CubeTableStoredState) => {
      if (!storageKey || typeof window === 'undefined') return;

      const allowed = persistRef.current;
      const entries = Object.entries(patch).filter(([key]) =>
        allowed.includes(key as CubeTablePersistKey),
      );

      if (!entries.length) return;

      try {
        const next = {
          ...read(storageKey),
          ...Object.fromEntries(entries),
        };

        window.localStorage.setItem(PREFIX + storageKey, JSON.stringify(next));
      } catch {
        // Quota exceeded or a disabled store — nothing to do but carry on.
      }
    },
    [storageKey],
  );

  return {
    initial: storageKey ? initial : {},
    /** `true` when this key is persisted, so callers can skip the work. */
    has: (key: CubeTablePersistKey) => !!storageKey && persist.includes(key),
    write,
  };
}
