import { Key, useMemo } from 'react';

import { usePersistentNotificationsContext } from './NotificationContext';

import type { PersistentNotificationItem } from './types';

/**
 * Hook to access the persistent notifications list.
 *
 * Items are ordered newest first (by `createdAt`, descending).
 *
 * @example
 * ```tsx
 * const { items, count, remove, clear } = usePersistentNotifications();
 *
 * return (
 *   <div>
 *     <span>Notifications ({count})</span>
 *     {items.map(item => (
 *       <div key={item.id}>
 *         {item.title}
 *         <button onClick={() => remove(item.id)}>Remove</button>
 *       </div>
 *     ))}
 *     <button onClick={clear}>Clear all</button>
 *   </div>
 * );
 * ```
 */
export function usePersistentNotifications(): {
  items: PersistentNotificationItem[];
  count: number;
  remove: (id: Key) => void;
  clear: () => void;
  markAllAsRead: () => void;
} {
  const {
    persistentItems,
    removePersistentItem,
    clearPersistentItems,
    markAllAsRead,
  } = usePersistentNotificationsContext();

  return useMemo(
    () => ({
      items: persistentItems,
      count: persistentItems.length,
      remove: removePersistentItem,
      clear: clearPersistentItems,
      markAllAsRead,
    }),
    [persistentItems],
  );
}

/**
 * Hook to get total and unread counts for persistent notifications.
 *
 * - `total` — number of items in the persistent list.
 * - `unread` — items that haven't been seen in `PersistentNotificationsList` yet.
 *
 * @example
 * ```tsx
 * const { total, unread } = useNotificationsCount();
 * return <Badge count={unread} />;
 * ```
 */
export function useNotificationsCount(): { total: number; unread: number } {
  const { persistentItems } = usePersistentNotificationsContext();

  return useMemo(
    () => ({
      total: persistentItems.length,
      unread: persistentItems.filter((i) => !i.isRead).length,
    }),
    [persistentItems],
  );
}
