import type { Key, ReactNode } from 'react';

// ─── Notification Types ──────────────────────────────────────────────

export type NotificationType =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'note';

// ─── Notification Options ────────────────────────────────────────────

export interface NotificationBaseOptions {
  id?: Key;
  theme?: NotificationType;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

export interface OverlayNotificationOptions extends NotificationBaseOptions {
  mode?: 'overlay'; // default

  /**
   * Action buttons rendered below the notification description.
   * A default "Dismiss" button is auto-appended unless any action has
   * `isDismiss` set (detected automatically via context).
   * When omitted, only the default "Dismiss" button is shown (if `isDismissible`).
   */
  actions?: ReactNode;

  /**
   * Whether the notification shows the default dismiss UI:
   * - Auto-appended "Dismiss" button (suppressed when false)
   * - Escape key dismissal (disabled when false)
   *
   * Actions with `closeOnPress` (default `true`) can still close the
   * notification regardless of this setting.
   *
   * Default: true
   */
  isDismissible?: boolean;

  /**
   * Duration in ms before auto-dismiss.
   * Default: 5000ms (non-persistent) or 10000ms (persistent).
   * null = no auto-dismiss.
   */
  duration?: number | null;

  /**
   * Whether to retain in persistent list on timeout dismissal.
   * Only `timeout` dismissals move to the persistent list — user-initiated
   * dismissals (`close`, `action`) intentionally skip persistence.
   * Default: false
   */
  persistent?: boolean;
}

export interface StoredNotificationOptions extends NotificationBaseOptions {
  mode: 'stored';

  /** Action buttons (same ReactNode format as overlay notifications) */
  actions?: ReactNode;

  /**
   * Timestamp (epoch ms) for when the notification was originally created.
   * Use this when restoring server-sourced notifications to preserve the original time.
   * Defaults to `Date.now()` if omitted.
   */
  createdAt?: number;
}

export type NotificationOptions =
  | OverlayNotificationOptions
  | StoredNotificationOptions;

export type DismissReason = 'close' | 'timeout' | 'action' | 'api';

// ─── Notification Action Props ───────────────────────────────────────

export interface NotificationActionProps {
  /** Action label */
  children?: ReactNode;
  /** Called when the action is pressed */
  onPress?: () => void;
  /** Whether to auto-dismiss the notification after onPress. Default: true */
  closeOnPress?: boolean;
  /** Whether the action is disabled */
  isDisabled?: boolean;
  /**
   * Marks this action as the notification's dismiss button.
   * Detected automatically via context — when any action in the notification
   * has `isDismiss` set, the auto-appended default "Dismiss" button is suppressed.
   */
  isDismiss?: boolean;
}

// ─── Notification Handle ─────────────────────────────────────────────

export interface NotificationHandle {
  id: Key;
  dismiss: () => void;
}

// ─── Notifications API ───────────────────────────────────────────────

export interface NotificationsApi {
  notify: (options: NotificationOptions) => NotificationHandle;
  /**
   * Shorthand for `notify({ mode: 'stored', ... })`.
   * Stores a notification directly to the persistent list without showing an overlay.
   * Kept as a separate method to make the "stored-only" intent explicit at call sites.
   */
  record: (
    options: Omit<StoredNotificationOptions, 'mode'>,
  ) => NotificationHandle;
  dismiss: (id: Key) => void;
}

// ─── Internal Types ──────────────────────────────────────────────────

export interface InternalNotification extends OverlayNotificationOptions {
  internalId: string;
  createdAt: number;
  updatedAt: number;
  isExiting?: boolean;
  ownerId?: string;
}

// ─── Persistent Notification ─────────────────────────────────────────

export interface PersistentNotificationItem {
  id: Key;
  theme?: NotificationType;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Action buttons (ReactNode) */
  actions?: ReactNode;
  createdAt: number;
  updatedAt: number;
  /** Whether the notification has been seen in the persistent list */
  isRead?: boolean;
  /** Owner ID for cleanup on hook/component unmount */
  ownerId?: string;
}

// ─── Persistent Notifications List Props ─────────────────────────────

export interface PersistentNotificationsListProps {
  onDismissItem?: (item: PersistentNotificationItem) => void;
  /** Called before any action's onPress handler fires. Useful for closing a parent popover. */
  onAction?: () => void;
  emptyState?: ReactNode;
}

// ─── Context Types ───────────────────────────────────────────────────

/**
 * Internal context for overlay notification machinery.
 * Not exported publicly — consumers should use `useNotifications` hook instead.
 */
export interface InternalNotificationContextValue {
  addNotification: (
    options: OverlayNotificationOptions,
    ownerId?: string,
  ) => Key;
  removeNotification: (id: Key, reason?: DismissReason) => void;
  updateNotification: (
    id: Key,
    options: Partial<OverlayNotificationOptions>,
  ) => void;
  notifications: InternalNotification[];

  // Persistent mutations needed by useNotifications
  addPersistentItem: (item: PersistentNotificationItem) => void;
  removePersistentItem: (id: Key) => void;
  removePersistentItemsByOwner: (ownerId: string) => void;

  // Ownership cleanup
  removeByOwner: (ownerId: string) => void;
}

/**
 * Public context for persistent notifications.
 * Used by `usePersistentNotifications` and `useNotificationsCount`.
 */
export interface PersistentNotificationsContextValue {
  persistentItems: PersistentNotificationItem[];
  removePersistentItem: (id: Key) => void;
  clearPersistentItems: () => void;
  markAllAsRead: () => void;
}

// ─── Overlay Provider Props ──────────────────────────────────────────

export interface OverlayProviderProps {
  children: ReactNode;
  /** Maximum number of persistent notifications to keep. Default: 200 */
  maxPersistentNotifications?: number;
}

// ─── Declarative Notification Props ──────────────────────────────────

export interface NotificationProps extends OverlayNotificationOptions {}
