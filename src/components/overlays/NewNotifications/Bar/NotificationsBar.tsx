import { Key, useRef } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { Item } from '@react-stately/collections';
import { useHover } from '@react-aria/interactions';
import { useFocusRing, focusSafely } from '@react-aria/focus';
import { tasty } from '../../../../tasty';
import { CubeNotifyApiPropsWithID } from '../types';
import { TransitionComponent } from './TransitionComponent';
import { FloatingNotification } from './FloatingNotification';
import { useNotificationsList, CollectionChildren } from '../hooks';
import { mergeProps } from '../../../../utils/react';
import { useEvent } from '../../../../_internal';

export type NotificationsBarProps = {
  items: Iterable<CubeNotifyApiPropsWithID>;
  children: CollectionChildren<CubeNotifyApiPropsWithID>;
  onRemoveNotification: (id: Key) => void;
  onDismissNotification: (id: Key) => void;
};

const NotificationsContainer = tasty({
  styles: {
    boxSizing: 'border-box',

    position: 'fixed',
    bottom: 'env(safe-area-inset-bottom, 0)',
    right: 'env(safe-area-inset-right, 0)',
    display: 'flex',
    flexDirection: 'column-reverse',
    width: 'auto 100% 45x',
    height: '100vh max',
    padding: '2x',
    gap: '1x',
    /* to be sure that we're over the legacy modal */
    zIndex: '1001',
    overflow: 'hidden',
    isolation: 'isolate',
    pointerEvents: 'none',

    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available max',
    },
  },
});

export function NotificationsBar(props: NotificationsBarProps): JSX.Element {
  const { items, children, onRemoveNotification, onDismissNotification } =
    props;

  const ref = useRef<HTMLElement | null>(null);

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

  return (
    <NotificationsContainer
      ref={ref}
      data-qa="notifications-bar"
      role="region"
      aria-live="polite"
      {...mergeProps(listProps, hoverProps, focusProps)}
    >
      <TransitionGroup component={null} enter exit>
        {[...state.collection].reverse().map((notification) => (
          <TransitionComponent key={notification.props.id}>
            <FloatingNotification
              isDisabledTimer={isHovered || isFocusVisible}
              id={notification.props.id}
              item={notification}
              state={state}
              onRemoveNotification={(key) => {
                onRemoveNotification(key);
                moveFocus(key);
              }}
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
