import { Fragment, Key, useContext, useEffect, useRef, useState } from 'react';

import { useEvent } from '../../../_internal';
import { tasty } from '../../../tasty';
import { Divider } from '../../content/Divider';
import { Text } from '../../content/Text';

import { formatRelativeTime } from './format-relative-time';
import { NotificationActionInterceptorContext } from './NotificationAction';
import { NotificationCard } from './NotificationCard';
import { usePersistentNotifications } from './use-persistent-notifications';

import type {
  DismissReason,
  PersistentNotificationItem,
  PersistentNotificationsListProps,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────

const MARK_READ_DELAY = 2000;
/** Interval (ms) at which relative timestamps refresh while the list is mounted. */
const TIMESTAMP_REFRESH_INTERVAL = 10_000;

// ─── Styled Components ──────────────────────────────────────────────

const ListContainer = tasty({
  qa: 'PersistentNotificationsList',
  role: 'log',
  'aria-label': 'Notifications',
  styles: {
    display: 'flex',
    flow: 'column',
  },
});

const EmptyStateContainer = tasty({
  styles: {
    display: 'flex',
    placeItems: 'center',
    placeContent: 'center',
    padding: '4x',
    color: '#dark.5',
    preset: 't3',
  },
});

// ─── PersistentNotificationsList Component ───────────────────────────

/**
 * Standardized rendering for archived/persistent notifications.
 * Always reads items from the notification context.
 * Composable with app-specific shells (popover, dialog, page section).
 *
 * Marks all items as read after being visible for 2 seconds.
 * Relative timestamps refresh every 10 seconds while the list is mounted.
 *
 * Items are always dismissible. Dismissing an item removes it from the
 * persistent list and marks its ID as "fully dismissed" — subsequent triggers
 * with the same ID will be completely ignored (no overlay, no re-archival).
 *
 * @example
 * ```tsx
 * <PersistentNotificationsList emptyState="No notifications" />
 * ```
 */
export function PersistentNotificationsList({
  onDismissItem,
  onAction,
  emptyState,
}: PersistentNotificationsListProps) {
  const { items, remove, markAllAsRead } = usePersistentNotifications();

  // Default dismiss handler removes the item from the persistent list (which
  // also marks the id as "fully dismissed" so it won't reappear).
  // If a consumer provides `onDismissItem`, it is called *after* the built-in removal.
  const handleDismiss = useEvent((item: PersistentNotificationItem) => {
    remove(item.id);
    onDismissItem?.(item);
  });
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick counter that increments every TIMESTAMP_REFRESH_INTERVAL to force
  // re-render so relative timestamps (e.g. "5 min ago") stay up to date.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, TIMESTAMP_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [items.length]);

  // Mark all persistent notifications as read after a 2s delay.
  // Re-starts the timer whenever items change (e.g. new unread items arrive
  // while the list is already visible).
  useEffect(() => {
    const hasUnread = items.some((i) => !i.isRead);

    if (!hasUnread) return;

    markReadTimerRef.current = setTimeout(() => {
      markAllAsRead();
    }, MARK_READ_DELAY);

    return () => {
      if (markReadTimerRef.current) {
        clearTimeout(markReadTimerRef.current);
        markReadTimerRef.current = null;
      }
    };
  }, [markAllAsRead, items]);

  if (items.length === 0) {
    return (
      <ListContainer>
        <EmptyStateContainer>
          {emptyState ?? 'No notifications'}
        </EmptyStateContainer>
      </ListContainer>
    );
  }

  return (
    <NotificationActionInterceptorContext.Provider value={onAction ?? null}>
      <ListContainer>
        {items.map((item, index) => (
          <Fragment key={String(item.id)}>
            {index > 0 && <Divider />}
            <PersistentNotificationListItem
              item={item}
              onDismiss={handleDismiss}
            />
          </Fragment>
        ))}
      </ListContainer>
    </NotificationActionInterceptorContext.Provider>
  );
}

// ─── List Item ───────────────────────────────────────────────────────

interface PersistentNotificationListItemProps {
  item: PersistentNotificationItem;
  onDismiss?: (item: PersistentNotificationItem) => void;
}

function PersistentNotificationListItem({
  item,
  onDismiss,
}: PersistentNotificationListItemProps) {
  const suffix = (
    <Text opacity={0.5} preset="c2">
      {formatRelativeTime(item.createdAt)}
    </Text>
  );

  // useEvent keeps the callback stable across re-renders regardless of
  // item reference changes (avoids unnecessary NotificationCard re-renders).
  const handleDismiss = useEvent((_id: Key, _reason: DismissReason) => {
    onDismiss?.(item);
  });

  const parentInterceptor = useContext(NotificationActionInterceptorContext);

  // Chains with the list-level interceptor (e.g. closing the parent popover).
  // Dismissal itself is handled by NotificationAction via the dismiss context
  // to avoid double-firing onDismiss.
  const handleItemAction = useEvent(() => {
    parentInterceptor?.();
  });

  return (
    <NotificationActionInterceptorContext.Provider value={handleItemAction}>
      <NotificationCard
        qa="PersistentNotificationItem"
        theme={item.theme}
        title={item.title}
        description={item.description}
        icon={item.icon}
        actions={item.actions}
        isDismissible={!!onDismiss}
        elevated={false}
        notificationId={item.id}
        suffix={suffix}
        onDismiss={onDismiss ? handleDismiss : undefined}
      />
    </NotificationActionInterceptorContext.Provider>
  );
}
