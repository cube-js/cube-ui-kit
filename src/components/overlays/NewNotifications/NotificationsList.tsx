import { useRef } from 'react';
import { Item } from '@react-stately/collections';
import { CollectionElement } from '@react-types/shared';
import { tasty } from '../../../tasty';
import { Notification } from './Notification';
import type { CubeNotificationProps } from './types';
import {
  CollectionChildren,
  NotificationItemNode,
  NotificationsListState,
  useNotificationListItem,
  useNotificationsList,
} from './hooks';

export type NotificationsListProps<T> = {
  items?: T[] | readonly T[];
  children: CollectionChildren<T>;
} & (NotificationsListFactory<T> | NotificationsListStatic);

export type NotificationsListFactory<T> = {
  items: T[] | readonly T[];
  children: (item: T) => CollectionElement<CubeNotificationProps>;
};

export type NotificationsListStatic = {
  items?: 'You must either use factory or static children';
  children:
    | CollectionElement<CubeNotificationProps>
    | CollectionElement<CubeNotificationProps>[];
};

const NotificationListContainer = tasty({
  styles: { boxSizing: 'border-box', width: '100%' },
});

export function NotificationsList<T extends object>(
  props: NotificationsListProps<T>,
): JSX.Element {
  const { items, children } = props;

  const ref = useRef<HTMLDivElement | null>(null);

  const { state, listProps } = useNotificationsList({
    items,
    children,
    ref,
  });

  return (
    <NotificationListContainer ref={ref} {...listProps}>
      {[...state.collection].map((item) => (
        <NotificationListItem key={item.key} item={item} state={state} />
      ))}
    </NotificationListContainer>
  );
}

NotificationsList.Item = Item as unknown as (
  props: CubeNotificationProps,
) => null;

type NotificationListItemProps = {
  item: NotificationItemNode<CubeNotificationProps>;
  state: NotificationsListState<CubeNotificationProps>;
};

const notificationStyles = {
  borderBottom: { '': '1bw solid #border', ':last-child': 'none' },
};

function NotificationListItem(props: NotificationListItemProps) {
  const { item, state } = props;
  const { key, props: notificationProps } = item;

  const ref = useRef<HTMLDivElement>(null);

  const { itemProps } = useNotificationListItem({ ref, key, state });

  return (
    <Notification
      ref={ref}
      isDismissible={false}
      attributes={itemProps}
      styles={notificationStyles}
      {...notificationProps}
    />
  );
}
