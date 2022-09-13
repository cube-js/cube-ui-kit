import { createContext, PropsWithChildren, useContext } from 'react';
import invariant from 'tiny-invariant';

interface NotificationContextType {
  onClose?: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export function NotificationProvider(
  props: PropsWithChildren<NotificationContextType>,
): JSX.Element {
  const { children, ...value } = props;

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  invariant(
    context,
    'This component cannot be used outside of <Notification />',
  );

  return context;
}
