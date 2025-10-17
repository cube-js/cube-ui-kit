import { Key, KeyboardEventHandler, memo, useRef } from 'react';

import { useChainedCallback, useEvent, useTimer } from '../../../../_internal';
import { tasty } from '../../../../tasty';
import {
  NotificationItemNode,
  NotificationsListState,
  useNotificationListItem,
} from '../hooks';
import { NotificationView } from '../NotificationView';
import { CubeNotifyApiPropsWithID } from '../types';

export type FloatingNotificationProps = {
  id: Key;
  isDisabledTimer: boolean;
  onRemoveNotification: (id: Key) => void;
  onDismissNotification: (id: Key) => void;
  item: NotificationItemNode<CubeNotifyApiPropsWithID>;
  state: NotificationsListState<CubeNotifyApiPropsWithID>;
};

const NotificationContainer = tasty({
  styles: {
    overflow: 'hidden',
    radius: '1cr',
    shadow: true,
    pointerEvents: 'auto',
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationsBar`.
 */
export const FloatingNotification = memo(function FloatingNotification(
  props: FloatingNotificationProps,
) {
  const {
    item,
    state,
    onRemoveNotification,
    id,
    isDisabledTimer,
    onDismissNotification,
  } = props;
  const { props: notificationProps, key } = item;

  const ref = useRef<HTMLDivElement | null>(null);
  const onCloseEvent = useChainedCallback(
    () => onRemoveNotification(id),
    notificationProps.onClose,
  );

  const chainedOnDismiss = useChainedCallback(
    () => onDismissNotification(id),
    () => onRemoveNotification(id),
    notificationProps.onDismiss,
  );

  const onKeyDown = useEvent<KeyboardEventHandler<HTMLElement>>(({ key }) => {
    if (notificationProps.isDismissible === false) {
      return;
    }

    const closeKeys = ['Delete', 'Backspace', 'Escape'];

    if (closeKeys.includes(key)) {
      chainedOnDismiss();
    }
  });

  const { itemProps } = useNotificationListItem({ key, ref, state });

  const { timer } = useTimer({
    callback: chainedOnDismiss,
    delay: notificationProps.duration,
    isDisabled: isDisabledTimer,
  });

  return (
    <NotificationContainer>
      <NotificationView
        ref={ref}
        {...notificationProps}
        timer={timer}
        attributes={{
          ...itemProps,
          onKeyDown,
          role: 'status',
          'aria-atomic': 'true',
        }}
        qa="FloatingNotification"
        onDismiss={chainedOnDismiss}
        onClose={onCloseEvent}
      />
    </NotificationContainer>
  );
});
