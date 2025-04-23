import { CollectionElement } from '@react-types/shared';
import { Key } from 'react';

import {
  CollectionChildren,
  NotificationItemNode,
  NotificationsListState,
} from '../hooks';
import { CubeNotificationProps } from '../types';

export type NotificationsListProps<T> = {
  onDismiss?: (id: Key) => void;
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

export type NotificationListItemProps = {
  onDismiss?: NotificationsListProps<unknown>['onDismiss'];
  item: NotificationItemNode<CubeNotificationProps>;
  state: NotificationsListState<CubeNotificationProps>;
};
