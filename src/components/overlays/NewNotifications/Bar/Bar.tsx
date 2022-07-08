import { Key } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { Portal } from '../../../portal';
import { tasty } from '../../../../tasty';
import { CubeNotifyApiProps } from '../types';
import { TransitionComponent } from './TransitionComponent';
import { FloatingNotification } from './FloatingNotification';

export type NotificationsBarProps = {
  toasts: Map<Key, CubeNotifyApiProps>;
  onRemoveToast: (id: Key) => void;
};

const NotificationsList = tasty({
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
    zIndex: '100',
    overflow: 'hidden',
    isolation: 'isolate',
    pointerEvents: 'none',
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available max',
    },
  },
});

export function NotificationsBar(props: NotificationsBarProps): JSX.Element {
  const { toasts, onRemoveToast } = props;

  return (
    <Portal>
      <NotificationsList
        data-qa="notifications-bar"
        role="region"
        aria-live="polite"
      >
        <TransitionGroup component={null} enter exit>
          {[...toasts.entries()].reverse().map(([id, notificationProps]) => (
            <TransitionComponent key={id}>
              <FloatingNotification
                id={id}
                notificationProps={notificationProps}
                onRemoveToast={onRemoveToast}
              />
            </TransitionComponent>
          ))}
        </TransitionGroup>
      </NotificationsList>
    </Portal>
  );
}
