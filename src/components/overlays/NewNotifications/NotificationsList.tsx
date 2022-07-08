import { useRef } from 'react';
import { Item } from '@react-stately/collections';
import { useListState } from '@react-stately/list';
import { ListState } from '@react-stately/list';
import { useSelectableItem, useSelectableList } from '@react-aria/selection';
import type { CollectionChildren, Node } from '@react-types/shared';
import { tasty } from '../../../tasty';
import { Notification } from './Notification';
import type { CubeNotificationProps } from './types';

export type NotificationsListProps = {
  children: CollectionChildren<CubeNotificationProps>;
};

const NotificationListContainer = tasty({});

export function NotificationsList(props: NotificationsListProps): JSX.Element {
  const listRef = useRef<HTMLDivElement | null>(null);
  const state = useListState({ selectionMode: 'none', ...props });
  const { listProps } = useSelectableList({
    ref: listRef,
    allowsTabNavigation: true,
    ...props,
    ...state,
  });

  return (
    <NotificationListContainer ref={listRef} {...listProps}>
      {[...state.collection].map((item) => (
        <NotificationListItem
          key={item.key}
          item={item as NotificationItemNode}
          state={state}
        />
      ))}
    </NotificationListContainer>
  );
}

NotificationsList.Item = Item as unknown as (
  props: CubeNotificationProps,
) => null;

type NotificationItemNode = Omit<Node<CubeNotificationProps>, 'props'> & {
  props: CubeNotificationProps;
};

type NotificationListItemProps = {
  item: NotificationItemNode;
  state: ListState<CubeNotificationProps>;
};

const NotificationItemContainer = tasty({
  styles: { borderBottom: { '': '1bw solid #border', ':last-child': 'none' } },
});

function NotificationListItem(props: NotificationListItemProps) {
  const { item, state } = props;
  const { key, props: notificationProps } = item;

  const ref = useRef<HTMLDivElement>(null);
  let { itemProps } = useSelectableItem({
    ref,
    key,
    selectionManager: state.selectionManager,
  });

  return (
    <NotificationItemContainer>
      <Notification
        ref={ref}
        isClosable={false}
        attributes={itemProps}
        {...notificationProps}
      />
    </NotificationItemContainer>
  );
}
