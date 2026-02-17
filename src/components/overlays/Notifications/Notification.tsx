import { Key, useEffect, useRef } from 'react';

import { useNotificationContext } from './NotificationContext';

import type { NotificationProps } from './types';

/**
 * Declarative Notification component that shows a notification while mounted.
 * Only supports `mode: 'overlay'` (the default).
 *
 * Duration defaults are the same as for imperative `notify()`:
 * - 5000ms for all notifications
 * - Pass `duration={null}` explicitly to disable auto-dismiss.
 *
 * Semantics:
 * - mount → show or update by `id`
 * - unmount → remove from overlay and persistent list
 *
 * @example
 * ```tsx
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
export function Notification(props: NotificationProps): null {
  const {
    addNotification,
    removeNotification,
    updateNotification,
    removePersistentItem,
  } = useNotificationContext();
  const notificationIdRef = useRef<Key | null>(null);
  // Tracks how many times the update effect has run. The first run (0 → 1)
  // coincides with mount and must be skipped because addNotification already
  // handles the initial state.
  const renderCountRef = useRef(0);

  // Show notification on mount
  useEffect(() => {
    const id = addNotification({
      ...props,
      mode: 'overlay',
    });

    notificationIdRef.current = id;

    return () => {
      if (notificationIdRef.current != null) {
        removeNotification(notificationIdRef.current, 'api');
        removePersistentItem(notificationIdRef.current);
        notificationIdRef.current = null;
      }
    };
  }, []);

  // Update notification when props change (skip initial mount)
  useEffect(() => {
    // Skip the first run — it coincides with the mount effect above
    if (renderCountRef.current === 0) {
      renderCountRef.current = 1;

      return;
    }

    if (notificationIdRef.current != null) {
      updateNotification(notificationIdRef.current, {
        ...props,
        mode: 'overlay',
      });
    }
  }, [
    props.id,
    props.theme,
    props.title,
    props.description,
    props.icon,
    props.actions,
    props.isDismissible,
    props.persistent,
    props.duration,
  ]);

  return null;
}
