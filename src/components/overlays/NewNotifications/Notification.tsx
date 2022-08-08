import { useEffect } from 'react';
import { useNotificationsApi } from './hooks';
import { CubeNotifyApiProps } from './types';
import { useId } from '../../../utils/react/useId';

export type NotificationProps = {
  /**
   * If set to true, when the component gets unmounted, notifications will not be removed from the bar
   *
   * @default false
   */
  disableRemoveOnUnmount?: boolean;
} & CubeNotifyApiProps;

export function Notification(props: NotificationProps) {
  const { id: propsId, disableRemoveOnUnmount = false } = props;

  const { notify, update, remove } = useNotificationsApi();
  const defaultId = useId();

  const id = propsId ?? defaultId;

  useEffect(() => {
    notify({ id, ...props });
  }, [id]);

  useEffect(() => {
    if (disableRemoveOnUnmount) {
      return;
    }

    return () => remove(id);
  }, []);

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
