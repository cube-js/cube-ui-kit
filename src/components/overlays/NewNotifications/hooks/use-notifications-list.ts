import type { HTMLAttributes, MutableRefObject } from 'react';
import type { CollectionElement as ReactAriaCollectionElement } from '@react-types/shared';
import { useListState } from '@react-stately/list';
import { useSelectableList } from '@react-aria/selection';
import { CollectionChildren, NotificationsListState } from './types';

export type UseNotificationsListPropsType<T, R> = {
  items?: Iterable<T>;
  children: CollectionChildren<T, R>;
  ref: MutableRefObject<HTMLElement | null>;
};

export type UseNotificationsListReturnType<R> = {
  listProps: HTMLAttributes<HTMLElement>;
  state: NotificationsListState<R>;
};

export function useNotificationsList<T extends object, R>(
  props: UseNotificationsListPropsType<T, R>,
) {
  const { ref, children, items } = props;

  const state = useListState({
    selectionMode: 'none',
    children: children as unknown as ReactAriaCollectionElement<T>,
    items: items as unknown as T[],
    suppressTextValueWarning: true,
  });

  const { listProps } = useSelectableList({
    ref,
    allowsTabNavigation: true,
    ...state,
  });

  return {
    listProps,
    state,
  } as UseNotificationsListReturnType<R>;
}
