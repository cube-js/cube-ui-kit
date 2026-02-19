import { createContext, useContext } from 'react';

import type { ToastContextValue } from '../Toast/types';
import type {
  InternalNotificationContextValue,
  PersistentNotificationsContextValue,
} from './types';

// ─── Contexts ─────────────────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Internal context for overlay notification machinery.
 * Not exported publicly — consumers should use `useNotifications` hook.
 */
export const NotificationContext =
  createContext<InternalNotificationContextValue | null>(null);

/**
 * Public context for persistent notifications.
 * Used by `usePersistentNotifications` and `useNotificationsCount` hooks.
 */
export const PersistentNotificationsContext =
  createContext<PersistentNotificationsContextValue | null>(null);

// ─── Context Hooks ────────────────────────────────────────────────────

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToastContext must be used within an OverlayProvider');
  }

  return context;
}

export function useNotificationContext(): InternalNotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotificationContext must be used within an OverlayProvider',
    );
  }

  return context;
}

export function usePersistentNotificationsContext(): PersistentNotificationsContextValue {
  const context = useContext(PersistentNotificationsContext);

  if (!context) {
    throw new Error(
      'usePersistentNotificationsContext must be used within an OverlayProvider',
    );
  }

  return context;
}
