// ─── Components ──────────────────────────────────────────────────────

import { Notification as NotificationBase } from './Notification';
import { NotificationAction } from './NotificationAction';

export { NotificationAction } from './NotificationAction';
export { NotificationCard } from './NotificationCard';
export type { NotificationCardProps } from './NotificationCard';
export { NotificationItem } from './NotificationItem';
export type { NotificationItemProps } from './NotificationItem';
export { PersistentNotificationsList } from './PersistentNotificationsList';

// ─── Provider ────────────────────────────────────────────────────────

export { OverlayProvider } from './OverlayProvider';

// useToastContext is re-exported for Toast module backward compatibility
export { useToastContext } from './NotificationContext';

// ─── Hooks ───────────────────────────────────────────────────────────

export { useNotifications } from './use-notifications';
export {
  usePersistentNotifications,
  useNotificationsCount,
} from './use-persistent-notifications';

// ─── Utilities ───────────────────────────────────────────────────────

export { formatRelativeTime } from './format-relative-time';

// ─── Types ───────────────────────────────────────────────────────────

export type {
  NotificationType,
  DismissReason,
  NotificationBaseOptions,
  OverlayNotificationOptions,
  StoredNotificationOptions,
  NotificationOptions,
  NotificationActionProps,
  NotificationHandle,
  NotificationsApi,
  PersistentNotificationItem,
  PersistentNotificationsListProps,
  OverlayProviderProps,
  NotificationProps,
} from './types';

// ─── Compound Notification Component ─────────────────────────────────

/**
 * Declarative Notification component with compound API.
 *
 * @example
 * ```tsx
 * // Declarative usage
 * <Notification
 *   id="release:new-version"
 *   theme="warning"
 *   title="New release available"
 *   description="2.0.0 can be installed now."
 *   actions={
 *     <>
 *       <Notification.Action>Later</Notification.Action>
 *       <Notification.Action onPress={() => openUpgradeDialog()}>
 *         Upgrade
 *       </Notification.Action>
 *     </>
 *   }
 * />
 * ```
 */
export const Notification = Object.assign(NotificationBase, {
  Action: NotificationAction,
});

export type NotificationComponent = typeof Notification;
