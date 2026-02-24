import { Key, useRef, useState } from 'react';

import { useEvent } from '../../../_internal';

import { cleanupAndGetValidIds, saveDismissedId } from './dismissed-storage';

import type { PersistentNotificationItem } from './types';

// ─── Types ───────────────────────────────────────────────────────────

export interface PersistentState {
  persistentItems: PersistentNotificationItem[];
  addPersistentItem: (item: PersistentNotificationItem) => void;
  removePersistentItem: (id: Key) => void;
  removePersistentItemsByOwner: (ownerId: string) => void;
  clearPersistentItems: () => void;
  markAllAsRead: () => void;
  /**
   * Returns true if the given id was previously moved to the persistent list
   * and has NOT been explicitly removed from it (i.e. still archived, or was
   * auto-dismissed but not yet user-dismissed from the persistent list).
   */
  hasDismissedPersistentId: (id: Key) => boolean;
  /**
   * Returns true if the given id was explicitly removed from the persistent
   * list by the user. Such notifications should be completely ignored on
   * subsequent triggers (no overlay, no persistent storage).
   */
  isFullyDismissedId: (id: Key) => boolean;
  /**
   * Marks an id as dismissed in both the in-memory set and localStorage.
   * Used for `'action'` dismissals that go through `removePersistentItem`
   * instead of `addPersistentItem`.
   */
  saveDismissedPersistentId: (id: Key) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function usePersistentState(maxItems: number): PersistentState {
  const [persistentItems, setPersistentItems] = useState<
    PersistentNotificationItem[]
  >([]);

  // Tracks IDs that have been moved to the persistent list at least once.
  // Used to skip the overlay when the same id reappears.
  // Initialized from localStorage so dismissed IDs survive page reloads.
  const dismissedPersistentIdsRef = useRef<Set<Key>>(cleanupAndGetValidIds());

  // Tracks IDs that were explicitly removed from the persistent list by the
  // user. These should be completely ignored on subsequent triggers.
  const fullyDismissedIdsRef = useRef<Set<Key>>(new Set());

  const addPersistentItem = useEvent((item: PersistentNotificationItem) => {
    // If the user already dismissed this item from the persistent list, don't re-add it.
    if (fullyDismissedIdsRef.current.has(item.id)) return;

    dismissedPersistentIdsRef.current.add(item.id);
    saveDismissedId(item.id);

    setPersistentItems((prev) => {
      // Upsert by id
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      let newItems: PersistentNotificationItem[];

      if (existingIndex !== -1) {
        newItems = [...prev];
        // Updated items are marked unread again
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          ...item,
          isRead: false,
        };
      } else {
        newItems = [{ ...item, isRead: item.isRead ?? false }, ...prev];
      }

      // Enforce max cap
      if (newItems.length > maxItems) {
        newItems = newItems.slice(0, maxItems);
      }

      // Sort newest first
      newItems.sort((a, b) => b.createdAt - a.createdAt);

      return newItems;
    });
  });

  const removePersistentItem = useEvent((id: Key) => {
    fullyDismissedIdsRef.current.add(id);
    setPersistentItems((prev) => prev.filter((i) => i.id !== id));
  });

  const removePersistentItemsByOwner = useEvent((ownerId: string) => {
    setPersistentItems((prev) => prev.filter((i) => i.ownerId !== ownerId));
  });

  const clearPersistentItems = useEvent(() => {
    setPersistentItems([]);
  });

  const markAllAsRead = useEvent(() => {
    setPersistentItems((prev) => {
      const hasUnread = prev.some((i) => !i.isRead);

      if (!hasUnread) return prev;

      return prev.map((i) => (i.isRead ? i : { ...i, isRead: true }));
    });
  });

  const hasDismissedPersistentId = useEvent((id: Key): boolean => {
    return dismissedPersistentIdsRef.current.has(id);
  });

  const isFullyDismissedId = useEvent((id: Key): boolean => {
    return fullyDismissedIdsRef.current.has(id);
  });

  const saveDismissedPersistentId = useEvent((id: Key): void => {
    dismissedPersistentIdsRef.current.add(id);
    saveDismissedId(id);
  });

  return {
    persistentItems,
    addPersistentItem,
    removePersistentItem,
    removePersistentItemsByOwner,
    clearPersistentItems,
    markAllAsRead,
    hasDismissedPersistentId,
    isFullyDismissedId,
    saveDismissedPersistentId,
  };
}
