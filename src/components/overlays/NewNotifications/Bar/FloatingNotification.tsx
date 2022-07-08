import { Key, memo } from 'react';
import { tasty } from '../../../../tasty';
import { useChainedCallback } from '../../../../_internal';
import { CubeNotifyApiProps } from '../types';
import { Notification } from '../Notification';

export type FloatingNotificationProps = {
  id: Key;
  notificationProps: CubeNotifyApiProps;
  onRemoveToast: (id: Key) => void;
};

const NotificationContainer = tasty({
  styles: { boxShadow: '0 0.5x 2x #shadow', pointerEvents: 'auto' },
});

export const FloatingNotification = memo(function FloatingNotification(
  props: FloatingNotificationProps,
): JSX.Element {
  const { notificationProps, id, onRemoveToast } = props;

  const chainedOnClose = useChainedCallback(notificationProps.onClose, () =>
    onRemoveToast(id),
  );

  return (
    <NotificationContainer data-qa="floating-notification">
      <Notification
        {...notificationProps}
        duration={null}
        onClose={chainedOnClose}
        attributes={{ role: 'status', 'aria-atomic': 'true' }}
      />
    </NotificationContainer>
  );
});
