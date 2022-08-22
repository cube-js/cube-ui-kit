import { useContext } from 'react';
import invariant from 'tiny-invariant';

import { NotificationsContext } from '../NotificationsContext';

export function useNotificationsApi() {
  const context = useContext(NotificationsContext);

  invariant(
    context !== null,
    "You can't use Notifications outside of the <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return context.api;
}
