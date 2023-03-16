import { Key, useEffect } from 'react';

import { useEvent, useSyncRef } from '../../../_internal';
import { useId } from '../../../utils/react/useId';

import { useNotificationsApi } from './hooks';
import { CubeNotifyApiProps } from './types';

export type NotificationProps = {
  /**
   * If set to true, when the component gets unmounted, notifications will not be removed from the bar
   *
   * @default false
   */
  // eslint-disable-next-line react/boolean-prop-naming
  disableRemoveOnUnmount?: boolean;
} & CubeNotifyApiProps;

/**
 * Declarative wrap over the `useNotificationsApi` hook
 */
export function Notification(props: NotificationProps) {
  const { id: propsId, disableRemoveOnUnmount = false } = props;

  const defaultId = useId();
  const disableRemoveOnUnmountRef = useSyncRef(disableRemoveOnUnmount);
  const { notify, update, remove } = useNotificationsApi();

  const id = propsId ?? defaultId;

  const removeNotification = useEvent((id: Key) =>
    disableRemoveOnUnmountRef.current ? void 0 : remove(id),
  );

  useEffect(() => {
    notify({ id, ...props });
    // We can safety ignore props, bc we update notification in the another effect, this effect only mounts a notification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => () => removeNotification(id), [id, removeNotification]);
  useEffect(() => update(id, props));

  return null;
}

Notification.Success = function NotificationSuccess(props: NotificationProps) {
  return <Notification type="success" {...props} />;
};

Notification.Danger = function NotificationDanger(props: NotificationProps) {
  return <Notification type="danger" {...props} />;
};

Notification.Attention = function NotificationAttention(
  props: NotificationProps,
) {
  return <Notification type="attention" {...props} />;
};
