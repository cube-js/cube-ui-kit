import { createContext } from 'react';

import { CubeNotificationsApi, CubeNotifyApiPropsWithID } from '../types';

export const NotificationsContext = createContext<{
  api: CubeNotificationsApi;
  addOnDismissListener: (
    listener: (notification: CubeNotifyApiPropsWithID) => void,
  ) => () => void;
} | null>(null);
