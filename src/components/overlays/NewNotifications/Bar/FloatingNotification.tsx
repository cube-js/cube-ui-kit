import { Key, KeyboardEventHandler, memo, useRef } from 'react';
import { useChainedCallback, useEvent, useTimer } from '../../../../_internal';
import { tasty } from '../../../../tasty';
import { CubeNotifyApiPropsWithID } from '../types';
import { Notification } from '../Notification';
import {
  NotificationItemNode,
  NotificationsListState,
  useNotificationListItem,
} from '../hooks';

export type FloatingNotificationProps = {
  isDisabledTimer: boolean;
  id: Key;
  onRemoveToast: (id: Key) => void;
  item: NotificationItemNode<CubeNotifyApiPropsWithID>;
  state: NotificationsListState<CubeNotifyApiPropsWithID>;
};

const NotificationContainer = tasty({
  styles: { boxShadow: '0 0.5x 2x #shadow', pointerEvents: 'auto' },
});

export const FloatingNotification = memo(function FloatingNotification(
  props: FloatingNotificationProps,
): JSX.Element {
  const { item, state, onRemoveToast, id, isDisabledTimer } = props;
  const { props: notificationProps, key } = item;

  const ref = useRef<HTMLDivElement | null>(null);
  const chainedOnClose = useChainedCallback(notificationProps.onClose, () =>
    onRemoveToast(id),
  );

  const { itemProps } = useNotificationListItem({ key, ref, state });

  const { timer } = useTimer({
    callback: chainedOnClose,
    delay: notificationProps.duration,
    isDisabled: isDisabledTimer,
  });

  const onKeyDown = useEvent<KeyboardEventHandler<HTMLElement>>(({ key }) => {
    const closeKeys = ['Delete', 'Backspace', 'Escape'];

    if (closeKeys.includes(key)) {
      chainedOnClose();
    }
  });

  return (
    <NotificationContainer>
      <Notification
        ref={ref}
        {...notificationProps}
        timer={timer}
        attributes={{
          ...itemProps,
          onKeyDown,
          role: 'status',
          'aria-atomic': 'true',
        }}
        onClose={chainedOnClose}
        qa="floating-notification"
      />
    </NotificationContainer>
  );
});
