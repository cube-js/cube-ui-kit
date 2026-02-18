import { Key, useRef, useState } from 'react';

import { useEvent } from '../../../_internal';

import type {
  DismissReason,
  InternalNotification,
  OverlayNotificationOptions,
  PersistentNotificationItem,
} from './types';
import type { OverlayTimers } from './use-overlay-timers';

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_NOTIFICATION_DURATION = 3000;
const DEFAULT_PERSISTENT_NOTIFICATION_DURATION = 5000;
const MAX_NOTIFICATIONS = 5;

// ─── Types ───────────────────────────────────────────────────────────

export interface PersistentCallbacks {
  addPersistentItem: (item: PersistentNotificationItem) => void;
  removePersistentItem: (id: Key) => void;
  hasDismissedPersistentId: (id: Key) => boolean;
  isFullyDismissedId: (id: Key) => boolean;
}

export interface NotificationState {
  notifications: InternalNotification[];
  notificationsRef: ReturnType<typeof useRef<InternalNotification[]>>;
  addNotification: (
    options: OverlayNotificationOptions,
    ownerId?: string,
  ) => Key;
  removeNotification: (id: Key, reason?: DismissReason) => void;
  updateNotification: (
    id: Key,
    options: Partial<OverlayNotificationOptions>,
  ) => void;
  finalizeNotificationRemoval: (internalId: string) => void;
  removeByOwner: (ownerId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDuration(
  notif: OverlayNotificationOptions & { persistent?: boolean },
): number | null {
  if (notif.duration === null) return null;
  if (notif.duration !== undefined) return notif.duration;
  return notif.persistent
    ? DEFAULT_PERSISTENT_NOTIFICATION_DURATION
    : DEFAULT_NOTIFICATION_DURATION;
}

function matchesNotificationId(item: InternalNotification, id: Key): boolean {
  return item.id === id || item.internalId === String(id);
}

function findNotification(
  list: InternalNotification[],
  id: Key,
): InternalNotification | undefined {
  return list.find((n) => matchesNotificationId(n, id));
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * @param timersRef - Ref to the shared OverlayTimers instance. Accessed only
 *   inside callbacks (never during render), so it is guaranteed to be populated.
 */
export function useNotificationState(
  timersRef: ReturnType<typeof useRef<OverlayTimers>>,
  persistent: PersistentCallbacks,
): NotificationState {
  const [notifications, setNotifications] = useState<InternalNotification[]>(
    [],
  );
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const idCounter = useRef(0);

  // ─── Evict Helper ──────────────────────────────────────────────

  /**
   * Evict the oldest active notification to make room for a new one.
   * Clears its timer and moves it to the persistent list if applicable.
   * Must be called OUTSIDE setState updaters (StrictMode-safe).
   */
  const evictOldest = useEvent((): string | null => {
    const active = notificationsRef.current.filter((n) => !n.isExiting);

    if (active.length === 0) return null;

    // Oldest by createdAt (active list preserves insertion order)
    const oldest = active[0];

    timersRef.current?.clearNotificationTimer(oldest.internalId);

    // Eviction counts as a timeout dismissal — move to persistent list if applicable
    if (oldest.persistent) {
      persistent.addPersistentItem({
        id: oldest.id ?? oldest.internalId,
        theme: oldest.theme,
        title: oldest.title,
        description: oldest.description,
        icon: oldest.icon,
        actions: oldest.actions,
        createdAt: oldest.createdAt,
        updatedAt: oldest.updatedAt,
        isRead: false,
        ownerId: oldest.ownerId,
      });
    }

    return oldest.internalId;
  });

  // ─── Remove ─────────────────────────────────────────────────────

  const removeNotification = useEvent(
    (id: Key, reason: DismissReason = 'api') => {
      // Read from ref (synchronous) to perform side effects OUTSIDE the updater.
      // This prevents double-fire in StrictMode and avoids calling setState
      // (addPersistentItem) inside another setState updater.
      const notif = findNotification(notificationsRef.current, id);

      if (!notif || notif.isExiting) return;

      timersRef.current?.clearNotificationTimer(notif.internalId);

      if (notif.persistent) {
        if (reason === 'close' || reason === 'timeout') {
          // Dismiss button, Escape, or auto-dismiss timeout — move to persistent list.
          // If the same id is triggered again, it skips the overlay and updates the
          // persistent list directly.
          persistent.addPersistentItem({
            id: notif.id ?? notif.internalId,
            theme: notif.theme,
            title: notif.title,
            description: notif.description,
            icon: notif.icon,
            actions: notif.actions,
            createdAt: notif.createdAt,
            updatedAt: notif.updatedAt,
            isRead: true,
            ownerId: notif.ownerId,
          });
        } else if (reason === 'action') {
          // User clicked a regular action (not dismiss) — fully dismiss the
          // notification so it never reappears (overlay or persistent list).
          persistent.removePersistentItem(notif.id ?? notif.internalId);
        }
        // reason === 'api' — programmatic cleanup (e.g. component unmount).
        // No persistence, no full-dismiss tracking.
      }

      setNotifications((prev) =>
        prev.map((n) =>
          matchesNotificationId(n, id) ? { ...n, isExiting: true } : n,
        ),
      );
    },
  );

  // ─── Finalize ──────────────────────────────────────────────────

  const finalizeNotificationRemoval = useEvent((internalId: string) => {
    setNotifications((prev) => prev.filter((n) => n.internalId !== internalId));
  });

  // ─── Add ────────────────────────────────────────────────────────

  const addNotification = useEvent(
    (options: OverlayNotificationOptions, ownerId?: string): Key => {
      idCounter.current += 1;
      const internalId = `notif-${idCounter.current}-${Date.now()}`;
      const now = Date.now();
      const id = options.id ?? internalId;

      // If the user explicitly removed this notification from the persistent
      // list, completely ignore it — no overlay, no persistent storage.
      if (options.id != null && persistent.isFullyDismissedId(options.id)) {
        return id;
      }

      // If this persistent id was previously dismissed to the persistent list,
      // skip the overlay and update the persistent item directly.
      if (
        options.persistent &&
        options.id != null &&
        persistent.hasDismissedPersistentId(options.id)
      ) {
        persistent.addPersistentItem({
          id,
          theme: options.theme,
          title: options.title,
          description: options.description,
          icon: options.icon,
          actions: options.actions,
          createdAt: now,
          updatedAt: now,
          isRead: false,
          ownerId,
        });

        return id;
      }

      // Check for existing notification with same id via the ref (synchronous read).
      const existingNotif =
        options.id != null
          ? notificationsRef.current.find(
              (n) => n.id === options.id && !n.isExiting,
            )
          : undefined;

      if (existingNotif) {
        // In-place update of an existing notification
        const returnId = existingNotif.id ?? existingNotif.internalId;

        const prevTitle = existingNotif.title;
        const prevDescription = existingNotif.description;

        // Timer reset on string title/description change
        const titleChanged =
          typeof options.title === 'string' &&
          typeof prevTitle === 'string' &&
          options.title !== prevTitle;
        const descriptionChanged =
          typeof options.description === 'string' &&
          typeof prevDescription === 'string' &&
          options.description !== prevDescription;

        if (titleChanged || descriptionChanged) {
          const duration = getDuration(options);

          if (duration != null && duration > 0) {
            timersRef.current?.startNotificationTimer(
              existingNotif.internalId,
              existingNotif.id ?? existingNotif.internalId,
              duration,
            );
          }
        }

        setNotifications((prev) =>
          prev.map((n) => {
            if (n.internalId === existingNotif.internalId) {
              return {
                ...n,
                ...options,
                internalId: n.internalId,
                createdAt: n.createdAt,
                updatedAt: now,
                ownerId: ownerId ?? n.ownerId,
              };
            }
            return n;
          }),
        );

        return returnId;
      }

      // New notification — always show immediately, evicting the oldest if at cap.
      // Read from ref (synchronous) to perform side effects OUTSIDE the updater.
      const activeCount = notificationsRef.current.filter(
        (n) => !n.isExiting,
      ).length;

      const newNotification: InternalNotification = {
        ...options,
        id,
        internalId,
        createdAt: now,
        updatedAt: now,
        ownerId,
      };

      // Evict oldest if at cap (side effects outside updater)
      let evictedInternalId: string | null = null;

      if (activeCount >= MAX_NOTIFICATIONS) {
        evictedInternalId = evictOldest();
      }

      // Start timer for the new notification
      const duration = getDuration(options);

      if (duration != null && duration > 0) {
        timersRef.current?.startNotificationTimer(internalId, id, duration);
      }

      setNotifications((prev) => {
        let next = prev;

        if (evictedInternalId) {
          next = next.map((n) =>
            n.internalId === evictedInternalId ? { ...n, isExiting: true } : n,
          );
        }

        return [...next, newNotification];
      });

      return id;
    },
  );

  // ─── Update ─────────────────────────────────────────────────────

  const updateNotification = useEvent(
    (id: Key, options: Partial<OverlayNotificationOptions>) => {
      setNotifications((prev) =>
        prev.map((n) =>
          matchesNotificationId(n, id)
            ? { ...n, ...options, updatedAt: Date.now() }
            : n,
        ),
      );
    },
  );

  // ─── Owner Cleanup ──────────────────────────────────────────────

  const removeByOwner = useEvent((ownerId: string) => {
    // Clear timers outside the updater (StrictMode-safe).
    const owned = notificationsRef.current.filter(
      (n) => n.ownerId === ownerId && !n.isExiting,
    );

    for (const n of owned) {
      timersRef.current?.clearNotificationTimer(n.internalId);
    }

    setNotifications((prev) =>
      prev.map((n) => {
        if (n.ownerId === ownerId && !n.isExiting) {
          return { ...n, isExiting: true };
        }
        return n;
      }),
    );
  });

  return {
    notifications,
    notificationsRef,
    addNotification,
    removeNotification,
    updateNotification,
    finalizeNotificationRemoval,
    removeByOwner,
  };
}
