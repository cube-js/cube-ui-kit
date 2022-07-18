import { useEffect } from 'react';
import { useId } from '@react-aria/utils';
import { useNotificationsApi } from './hooks';
import { CubeNotifyApiProps } from './types';

export function Notification(props: CubeNotifyApiProps) {
  const { id: propsId } = props;
  const { notify, update, remove } = useNotificationsApi();
  const defaultId = useId();

  const id = propsId ?? defaultId;

  useEffect(() => {
    notify({ id, ...props });

    return () => remove(id);
  }, [id]);

  useEffect(() => {
    update(id, props);
  });

  return null;
}

Notification.Success = function NotificationSuccess(props: CubeNotifyApiProps) {
  return <Notification type="success" {...props} />;
};

Notification.Danger = function NotificationDanger(props: CubeNotifyApiProps) {
  return <Notification type="danger" {...props} />;
};

Notification.Attention = function NotificationAttention(
  props: CubeNotifyApiProps,
) {
  return <Notification type="attention" {...props} />;
};
