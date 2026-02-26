import { Key, KeyboardEvent } from 'react';

import { useEvent } from '../../../_internal';
import { tasty } from '../../../tasty';

import { NotificationCard } from './NotificationCard';

import type {
  DismissReason,
  InternalNotification,
  NotificationType,
} from './types';

// ─── ARIA Helpers ────────────────────────────────────────────────────

function getAriaRole(theme?: NotificationType): 'alert' | 'status' {
  if (theme === 'danger' || theme === 'warning') {
    return 'alert';
  }

  return 'status';
}

function getAriaLive(theme?: NotificationType): 'assertive' | 'polite' {
  if (theme === 'danger' || theme === 'warning') {
    return 'assertive';
  }

  return 'polite';
}

// ─── Styled Wrapper ──────────────────────────────────────────────────

/**
 * Wrapper element for overlay notification items.
 *
 * Accessibility attributes are set as static defaults:
 * - `tabIndex={0}`: Makes the notification focusable via keyboard, allowing
 *   users to Tab to it and press Escape to dismiss.
 * - `aria-atomic="true"`: Ensures screen readers announce the entire notification
 *   when content changes (not just the diff).
 * - `aria-relevant="additions text"`: Announces when new content is added or
 *   text changes, but not when elements are removed (e.g., during exit animation).
 *
 * The `role` and `aria-live` are set dynamically per-instance based on theme
 * (see `getAriaRole` and `getAriaLive` above).
 */
const NotificationItemWrapper = tasty({
  as: 'div',
  tabIndex: 0,
  'aria-atomic': 'true',
  'aria-relevant': 'additions text',
  styles: {
    outline: {
      '': 'none',
    },
  },
});

// ─── NotificationItem Component ─────────────────────────────────────

export interface NotificationItemProps {
  notification: InternalNotification;
  onDismiss: (id: Key, reason: DismissReason) => void;
  onRestore?: (id: Key) => void;
}

export function NotificationItem({
  notification,
  onDismiss,
  onRestore,
}: NotificationItemProps) {
  const {
    theme,
    title,
    description,
    icon,
    actions,
    isDismissable = true,
    id,
    internalId,
  } = notification;

  const notificationId = id ?? internalId;

  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDismissable) {
      e.stopPropagation();
      onDismiss(notificationId, 'close');
    }
  });

  return (
    <NotificationItemWrapper
      role={getAriaRole(theme)}
      aria-live={getAriaLive(theme)}
      onKeyDown={handleKeyDown}
    >
      <NotificationCard
        qa="Notification"
        theme={theme}
        title={title}
        description={description}
        icon={icon}
        actions={actions}
        isDismissable={isDismissable}
        notificationId={notificationId}
        onDismiss={onDismiss}
        onRestore={onRestore}
      />
    </NotificationItemWrapper>
  );
}
