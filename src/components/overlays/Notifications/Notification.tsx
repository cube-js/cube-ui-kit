import { Key, useEffect, useRef } from 'react';

import { useNotificationContext } from './NotificationContext';

import type { NotificationProps } from './types';

/**
 * Declarative Notification component that shows a notification while mounted.
 * Only supports `mode: 'overlay'` (the default).
 *
 * Semantics:
 * - mount → show or update by `id`
 * - unmount → dismiss unless `disableRemoveOnUnmount`
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
  const { disableRemoveOnUnmount, ...notificationOptions } = props;
  const { addNotification, removeNotification, updateNotification } =
    useNotificationContext();
  const notificationIdRef = useRef<Key | null>(null);
  // Tracks how many times the update effect has run. The first run (0 → 1)
  // coincides with mount and must be skipped because addNotification already
  // handles the initial state.
  const renderCountRef = useRef(0);
  const disableRemoveRef = useRef(disableRemoveOnUnmount);
  disableRemoveRef.current = disableRemoveOnUnmount;

  // Show notification on mount
  useEffect(() => {
    const id = addNotification({
      ...notificationOptions,
      mode: 'overlay',
      duration: notificationOptions.duration ?? null, // Persistent while mounted
    });

    notificationIdRef.current = id;

    return () => {
      if (!disableRemoveRef.current && notificationIdRef.current != null) {
        removeNotification(notificationIdRef.current, 'api');
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
        ...notificationOptions,
        mode: 'overlay',
        duration: notificationOptions.duration ?? null,
      });
    }
  }, [
    notificationOptions.id,
    notificationOptions.theme,
    notificationOptions.title,
    notificationOptions.description,
    notificationOptions.icon,
    notificationOptions.actions,
    notificationOptions.isDismissible,
    notificationOptions.persistent,
    notificationOptions.duration,
  ]);

  return null;
}
