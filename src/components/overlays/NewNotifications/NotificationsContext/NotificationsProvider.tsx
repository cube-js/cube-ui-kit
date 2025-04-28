import { createContext, PropsWithChildren, RefObject, useMemo } from 'react';

import { Portal } from '../../../portal';
import { NotificationsBar } from '../Bar';
import { CubeNotificationsApi, CubeNotifyApiPropsWithID } from '../types';

import { useNotifications } from './use-notifications';

export const NotificationsContext = createContext<{
  api: CubeNotificationsApi;
  addOnDismissListener: (
    listener: (notification: CubeNotifyApiPropsWithID) => void,
  ) => () => void;
} | null>(null);

export function NotificationsProvider(
  props: PropsWithChildren<{ rootRef: RefObject<HTMLElement | null> | null }>,
) {
  const { children, rootRef } = props;

  const { notifications, api, addOnDismissListener, onDismissNotification } =
    useNotifications(rootRef);

  const providerValue = useMemo(() => ({ api, addOnDismissListener }), []);

  return (
    <NotificationsContext.Provider value={providerValue}>
      <Portal>
        <NotificationsBar
          items={notifications}
          onRemoveNotification={api.remove}
          onDismissNotification={onDismissNotification}
        >
          {(notification) => (
            <NotificationsBar.Item key={notification.id} {...notification} />
          )}
        </NotificationsBar>
      </Portal>

      {children}
    </NotificationsContext.Provider>
  );
}
