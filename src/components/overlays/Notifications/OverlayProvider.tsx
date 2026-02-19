import { useMemo, useRef } from 'react';

import {
  NotificationContext,
  PersistentNotificationsContext,
  ToastContext,
} from './NotificationContext';
import { OverlayContainer } from './OverlayContainer';
import { useNotificationState } from './use-notification-state';
import { useOverlayTimers } from './use-overlay-timers';
import { usePersistentState } from './use-persistent-state';
import { useToastState } from './use-toast-state';

import type { ToastContextValue } from '../Toast/types';
import type {
  InternalNotificationContextValue,
  OverlayProviderProps,
  PersistentNotificationsContextValue,
} from './types';
import type { OverlayTimers } from './use-overlay-timers';

// ─── Re-export context hooks for consumers ───────────────────────────

export { useToastContext, useNotificationContext } from './NotificationContext';

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_MAX_PERSISTENT = 200;

// ─── OverlayProvider ─────────────────────────────────────────────────

export function OverlayProvider({
  children,
  maxPersistentNotifications = DEFAULT_MAX_PERSISTENT,
}: OverlayProviderProps) {
  // Shared ref that breaks the circular dependency between state hooks and timers.
  // State hooks need timer methods (start/clear), timer hooks need remove methods.
  // All consumers access the ref only inside useEvent/callbacks (never during
  // render), so it is guaranteed to be populated before first use.
  const timersRef = useRef<OverlayTimers>(null!);

  // 1. Persistent state (no dependencies on other hooks)
  const persistent = usePersistentState(maxPersistentNotifications);

  // 2. Toast state — accesses timers through the shared ref
  const toast = useToastState(timersRef);

  // 3. Notification state — accesses timers through the shared ref
  const notification = useNotificationState(timersRef, persistent);

  // 4. Create timers and populate the ref
  const timers = useOverlayTimers({
    toastsRef: toast.toastsRef,
    notificationsRef: notification.notificationsRef,
    removeToast: toast.removeToast,
    removeNotification: notification.removeNotification,
  });

  timersRef.current = timers;

  // ─── Context Values ───────────────────────────────────────────────

  // Only include actually-changing values in deps. All useEvent-based
  // callbacks are referentially stable and omitted.
  const toastContextValue = useMemo<ToastContextValue>(
    () => ({
      addToast: toast.addToast,
      removeToast: toast.removeToast,
      updateToast: toast.updateToast,
      toasts: toast.toasts,
    }),
    [toast.toasts],
  );

  const notificationContextValue = useMemo<InternalNotificationContextValue>(
    () => ({
      addNotification: notification.addNotification,
      removeNotification: notification.removeNotification,
      updateNotification: notification.updateNotification,
      notifications: notification.notifications,
      addPersistentItem: persistent.addPersistentItem,
      removePersistentItem: persistent.removePersistentItem,
      removePersistentItemsByOwner: persistent.removePersistentItemsByOwner,
      removeByOwner: notification.removeByOwner,
    }),
    [notification.notifications],
  );

  const persistentContextValue = useMemo<PersistentNotificationsContextValue>(
    () => ({
      persistentItems: persistent.persistentItems,
      removePersistentItem: persistent.removePersistentItem,
      clearPersistentItems: persistent.clearPersistentItems,
      markAllAsRead: persistent.markAllAsRead,
    }),
    [persistent.persistentItems],
  );

  return (
    <ToastContext.Provider value={toastContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <PersistentNotificationsContext.Provider value={persistentContextValue}>
          {children}
          <OverlayContainer
            toasts={toast.toasts}
            notifications={notification.notifications}
            onToastExitComplete={toast.finalizeToastRemoval}
            onNotificationExitComplete={
              notification.finalizeNotificationRemoval
            }
            onNotificationDismiss={notification.removeNotification}
            onPauseChange={timers.handlePauseChange}
          />
        </PersistentNotificationsContext.Provider>
      </NotificationContext.Provider>
    </ToastContext.Provider>
  );
}
