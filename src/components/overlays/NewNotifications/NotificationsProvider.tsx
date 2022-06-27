import { createContext, useContext } from 'react';
import invariant from 'tiny-invariant';
import { NotificationsBar } from './NotificationsBar';

const NotificationsContext = createContext(null);

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);

  invariant(
    context !== null,
    "You can't use Notifications outside of the <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return context;
}

export function NotificationsProvider(props) {
  const { children, value } = props;

  return (
    <NotificationsContext.Provider value={value}>
      <NotificationsBar />
      {children}
    </NotificationsContext.Provider>
  );
}
