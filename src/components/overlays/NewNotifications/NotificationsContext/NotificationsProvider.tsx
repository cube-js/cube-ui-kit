import { createContext, PropsWithChildren, useMemo } from 'react';
import { Portal } from '../../../portal';
import { NotificationsBar } from '../Bar';
import { CubeNotificationsApi, CubeNotifyApiProps } from '../types';
import { useNotificationToasts } from './use-notification-toasts';

export const NotificationsContext = createContext<{
  api: CubeNotificationsApi;
  addOnDismissListener: (
    listener: (toast: CubeNotifyApiProps) => void,
  ) => () => void;
} | null>(null);

export function NotificationsProvider(
  props: PropsWithChildren<Record<string, unknown>>,
): JSX.Element {
  const { children } = props;

  const { toasts, api, addOnDismissListener, onDismissNotification } =
    useNotificationToasts();

  const providerValue = useMemo(() => ({ api, addOnDismissListener }), []);

  return (
    <NotificationsContext.Provider value={providerValue}>
      <Portal>
        <NotificationsBar
          items={toasts}
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
