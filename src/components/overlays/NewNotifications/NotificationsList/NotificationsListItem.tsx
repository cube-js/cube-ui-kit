import { useRef } from 'react';

import { useNotificationListItem } from '../hooks';
import { tasty } from '../../../../tasty';
import { useEvent } from '../../../../_internal';
import { NotificationView } from '../NotificationView';

import { NotificationListItemProps } from './types';

const NotificationListItemWrap = tasty({
  styles: { borderBottom: { '': '1bw solid #border', ':last-child': 'none' } },
});

/**
 * @internal This component is not intended to be used
 */
export function NotificationListItem(props: NotificationListItemProps) {
  const { item, state, onDismiss } = props;
  const { key, props: notificationProps } = item;

  const ref = useRef<HTMLDivElement>(null);

  const onDismissEvent = useEvent(() => onDismiss?.(key));

  const { itemProps } = useNotificationListItem({ ref, key, state });

  return (
    <NotificationListItemWrap>
      <NotificationView
        ref={ref}
        attributes={itemProps}
        {...notificationProps}
        isDismissible={!!onDismiss}
        onDismiss={onDismissEvent}
      />
    </NotificationListItemWrap>
  );
}
