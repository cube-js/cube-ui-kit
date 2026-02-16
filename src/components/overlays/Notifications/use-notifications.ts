import { Key, useEffect, useRef } from 'react';

import { useEvent } from '../../../_internal';
import { useWarn } from '../../../_internal/hooks/use-warn';

import { useNotificationContext } from './NotificationContext';

import type {
  NotificationHandle,
  NotificationOptions,
  NotificationsApi,
  OverlayNotificationOptions,
  PersistentNotificationItem,
  StoredNotificationOptions,
} from './types';

let ownerIdCounter = 0;

function generateOwnerId(): string {
  ownerIdCounter += 1;
  return `notif-owner-${ownerIdCounter}-${Date.now()}`;
}

function isStoredMode(
  options: NotificationOptions,
): options is StoredNotificationOptions {
  return options.mode === 'stored';
}

/**
 * Hook to display and manage notifications.
 *
 * Each hook instance acts as an owner scope:
 * - `notify()` created from this instance attaches ownership metadata.
 * - On unmount, all attached visible overlay notifications are dismissed.
 * - On unmount, all attached persistent records are also removed.
 * - `notify()`/`dismiss()` calls from stale closures after unmount are no-ops.
 *
 * @example
 * ```tsx
 * const { notify, record, dismiss } = useNotifications();
 *
 * notify({
 *   id: 'deploy:123',
 *   theme: 'success',
 *   title: 'Deployment completed',
 *   description: 'Version 1.4.2 is live.',
 *   actions: (
 *     <>
 *       <Notification.Action onPress={() => openLogs()}>View logs</Notification.Action>
 *       <Notification.Action onPress={() => openDeployment()}>Open</Notification.Action>
 *     </>
 *   ),
 * });
 *
 * // Store directly to persistent list (no overlay)
 * record({
 *   id: 'server:alert-1',
 *   theme: 'warning',
 *   title: 'Server alert',
 * });
 * ```
 */
export function useNotifications(): NotificationsApi {
  const {
    addNotification,
    removeNotification,
    addPersistentItem,
    removePersistentItem,
    removeByOwner,
    removePersistentItemsByOwner,
  } = useNotificationContext();

  const ownerIdRef = useRef<string>(generateOwnerId());
  const isMountedRef = useRef(true);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track current options for validation
  const lastOptionsRef = useRef<NotificationOptions | null>(null);

  // ─── Validation Warnings ──────────────────────────────────────────

  useWarn(
    lastOptionsRef.current &&
      'persistent' in lastOptionsRef.current &&
      lastOptionsRef.current.persistent === true &&
      lastOptionsRef.current.id == null,
    {
      once: false,
      key: ['Notification', 'persistent-without-id'],
      args: [
        'Notification: `persistent: true` requires an explicit `id` for reliable dedupe/upsert.',
      ],
    },
  );

  useWarn(
    lastOptionsRef.current?.mode === 'stored' &&
      lastOptionsRef.current.id == null,
    {
      once: false,
      key: ['Notification', 'stored-without-id'],
      args: [
        'Notification: `mode: "stored"` should have an explicit `id` for reliable upsert.',
      ],
    },
  );

  // ─── Helpers ─────────────────────────────────────────────────────

  const storedIdCounter = useRef(0);

  const createStoredHandle = useEvent(
    (options: Omit<StoredNotificationOptions, 'mode'>): NotificationHandle => {
      storedIdCounter.current += 1;
      const now = Date.now();
      const id = options.id ?? `stored-${storedIdCounter.current}-${now}`;
      const createdAt = options.createdAt ?? now;

      const persistentItem: PersistentNotificationItem = {
        id,
        theme: options.theme,
        title: options.title,
        description: options.description,
        icon: options.icon,
        actions: options.actions ?? undefined,
        createdAt,
        updatedAt: createdAt,
        ownerId: ownerIdRef.current,
      };

      addPersistentItem(persistentItem);

      return {
        id,
        dismiss: () => {
          removePersistentItem(id);
        },
      };
    },
  );

  // ─── API ──────────────────────────────────────────────────────────

  const notify = useEvent(
    (options: NotificationOptions): NotificationHandle => {
      // Stale closure guard
      if (!isMountedRef.current) {
        return {
          id: options.id ?? '',
          dismiss: () => {},
        };
      }

      lastOptionsRef.current = options;

      if (isStoredMode(options)) {
        return createStoredHandle(options);
      }

      // Overlay mode
      const overlayOptions: OverlayNotificationOptions = {
        ...options,
        mode: 'overlay',
      };

      const notificationId = addNotification(
        overlayOptions,
        ownerIdRef.current,
      );

      return {
        id: notificationId,
        dismiss: () => {
          if (isMountedRef.current) {
            removeNotification(notificationId, 'api');
          }
        },
      };
    },
  );

  // `record()` is intentionally kept as a separate method from `notify()` to make
  // the API more explicit: `record()` always stores directly to the persistent list
  // (no overlay), while `notify()` defaults to overlay mode. Having both avoids
  // the caller needing to remember to pass `mode: 'stored'` every time.
  const record = useEvent(
    (options: Omit<StoredNotificationOptions, 'mode'>): NotificationHandle => {
      // Stale closure guard
      if (!isMountedRef.current) {
        return {
          id: options.id ?? '',
          dismiss: () => {},
        };
      }

      lastOptionsRef.current = { ...options, mode: 'stored' };

      return createStoredHandle(options);
    },
  );

  const dismiss = useEvent((id: Key) => {
    if (!isMountedRef.current) return;

    removeNotification(id, 'api');
  });

  // ─── Ownership Cleanup ────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    // Cancel any pending cleanup (Strict Mode re-mount)
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    return () => {
      isMountedRef.current = false;

      // Deferred cleanup — cancelled if owner re-mounts within same tick
      // (Strict Mode / Suspense safe)
      cleanupTimerRef.current = setTimeout(() => {
        removeByOwner(ownerIdRef.current);
        removePersistentItemsByOwner(ownerIdRef.current);
      }, 0);
    };
  }, [removeByOwner, removePersistentItemsByOwner]);

  return { notify, record, dismiss };
}
