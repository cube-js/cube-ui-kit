import { useContext, useEffect } from 'react';

import { useEvent } from '../../../../_internal';
import { NotificationsContext } from '../NotificationsContext';
import { CubeNotifyApiPropsWithID } from '../types';

export function useNotificationsObserver(
  callback: (notification: CubeNotifyApiPropsWithID) => void,
) {
  const { addOnDismissListener } = useContext(NotificationsContext) ?? {};
  const callbackEvent = useEvent(callback);

  useEffect(
    () => addOnDismissListener?.(callbackEvent),
    [addOnDismissListener],
  );
}
