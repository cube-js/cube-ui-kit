import { focusSafely } from '@react-aria/focus';
import { Key, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusRing, useHover } from 'react-aria';
import { Item } from 'react-stately';
import { TransitionGroup } from 'react-transition-group';

import { useChainedCallback, useEvent } from '../../../../_internal';
import { tasty } from '../../../../tasty';
import { mergeProps } from '../../../../utils/react';
import { CollectionChildren, useNotificationsList } from '../hooks';
import { CubeNotifyApiPropsWithID } from '../types';

import { FloatingNotification } from './FloatingNotification';
import { TransitionComponent } from './TransitionComponent';

export type NotificationsBarProps = {
  items: Iterable<CubeNotifyApiPropsWithID>;
  children: CollectionChildren<CubeNotifyApiPropsWithID>;
  onRemoveNotification: (id: Key) => void;
  onDismissNotification: (id: Key) => void;
  /**
   * Defines the amount of notifications that can be displayed at once.
   * @default 5
   */
  limit?: number;
};

const NotificationsContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    position: 'fixed',
    bottom: 'env(safe-area-inset-bottom, 0)',
    right: 'env(safe-area-inset-right, 0)',
    display: 'flex',
    flexDirection: 'column-reverse',
    width: 'auto 100% 50x',
    height: '100dvh max',
    padding: '2x',
    gap: '1x',
    /* to be sure that we're over the legacy modal and any widget as well */
    zIndex: 2147483647,
    overflow: 'hidden',
    isolation: 'isolate',
    pointerEvents: 'none',
  },
});

/**
 * @internal Do not use it
 */
export function NotificationsBar(props: NotificationsBarProps) {
  const {
    items,
    children,
    onRemoveNotification,
    onDismissNotification,
    limit = 5,
  } = props;

  const ref = useRef<HTMLElement | null>(null);
  const [realLimit, setRealLimit] = useState(limit + 1);
  const lastShownIdRef = useRef<Key>();

  const { listProps, state } = useNotificationsList({ items, children, ref });
  const { hoverProps, isHovered } = useHover({});
  const { focusProps, isFocusVisible } = useFocusRing({ within: true });

  const moveFocus = useEvent((key: Key) => {
    const nextKey =
      state.collection.getKeyBefore(key.toString()) ??
      state.collection.getKeyAfter(key.toString()) ??
      state.collection.getLastKey();

    const elementToFocus = ref.current?.querySelector(
      `[data-id="${nextKey}"]`,
    ) as HTMLElement;

    if (elementToFocus) {
      focusSafely(elementToFocus);
    }
  });

  const chainedOnRemoveNotification = useChainedCallback(
    onRemoveNotification,
    moveFocus,
  );

  let collection = [...state.collection].reverse();
  const collectionLength = collection.length;

  const lastShownNotificationIndex = collection.findIndex(
    (notification) => notification.props.id === lastShownIdRef.current,
  );

  if (lastShownNotificationIndex !== -1) {
    collection = collection.slice(0, lastShownNotificationIndex);
  }

  /**
   * Handy hack to improve animations if the limit is reached.
   */
  useLayoutEffect(() => {
    setRealLimit(limit + 1);
  }, [collectionLength]);

  useLayoutEffect(() => {
    if (realLimit > limit) {
      setRealLimit(limit);
    }
  }, [realLimit]);

  // Set the last notification that was gone off the limit
  collection.slice(realLimit).forEach((notification) => {
    // It's safe 'cause there is always only a single notification above the limit
    lastShownIdRef.current = notification.props.id;
  });

  useEffect(() => {
    // Auto-dismiss the last shown notification that was off the limit
    if (lastShownIdRef.current) {
      onDismissNotification(lastShownIdRef.current);
      onRemoveNotification(lastShownIdRef.current);

      const lastNotification = collection.find(
        (notification) => notification.props.id === lastShownIdRef.current,
      );

      lastNotification?.props.onDismiss?.();
    }
  }, [lastShownIdRef.current]);

  return (
    <NotificationsContainer
      ref={ref}
      qa="NotificationsBar"
      role="region"
      aria-live="polite"
      {...mergeProps(listProps, hoverProps, focusProps)}
    >
      <TransitionGroup enter exit component={null}>
        {collection.slice(0, realLimit).map((notification) => (
          <TransitionComponent key={notification.props.id}>
            <FloatingNotification
              isDisabledTimer={isHovered || isFocusVisible}
              id={notification.props.id}
              item={notification}
              state={state}
              onRemoveNotification={chainedOnRemoveNotification}
              onDismissNotification={onDismissNotification}
            />
          </TransitionComponent>
        ))}
      </TransitionGroup>
    </NotificationsContainer>
  );
}

NotificationsBar.Item = Item as unknown as (
  props: CubeNotifyApiPropsWithID,
) => null;
