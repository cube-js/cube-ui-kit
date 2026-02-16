import { Key, useState } from 'react';

import { useEvent } from '../../../_internal';

import type { PersistentNotificationItem } from './types';

// ─── Types ───────────────────────────────────────────────────────────

export interface PersistentState {
  persistentItems: PersistentNotificationItem[];
  addPersistentItem: (item: PersistentNotificationItem) => void;
  removePersistentItem: (id: Key) => void;
  removePersistentItemsByOwner: (ownerId: string) => void;
  clearPersistentItems: () => void;
  markAllAsRead: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function usePersistentState(maxItems: number): PersistentState {
  const [persistentItems, setPersistentItems] = useState<
    PersistentNotificationItem[]
  >([]);

  const addPersistentItem = useEvent((item: PersistentNotificationItem) => {
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

  return {
    persistentItems,
    addPersistentItem,
    removePersistentItem,
    removePersistentItemsByOwner,
    clearPersistentItems,
    markAllAsRead,
  };
}
