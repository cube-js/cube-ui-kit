import { Key, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  CubeNotificationsApi,
  CubeNotifyApiProps,
  CubeNotifyApiPropsWithID,
} from '../types';
import { useEvent } from '../../../../_internal';

const DISMISS_EVENT_NAME = 'cube:notification:dismiss';
type DismissEvent = CustomEvent<CubeNotifyApiProps>;

export function useNotifications(
  rootRef: RefObject<HTMLElement | null> | null,
) {
  const idRef = useRef(0);
  const listeners = useRef<(() => void)[]>([]);
  const [toasts, setToasts] = useState<Map<Key, CubeNotifyApiPropsWithID>>(
    new Map(),
  );

  const addToast = useEvent((props: CubeNotifyApiProps) => {
    const nextID = idRef.current++;
    const { id = nextID, duration, isDismissible = true, ...rest } = props;

    setToasts((toasts) => {
      const newToasts = new Map(toasts);
      newToasts.set(id, {
        id,
        duration: isDismissible ? 5_000 : null,
        ...rest,
      } as CubeNotifyApiPropsWithID);

      return newToasts;
    });

    return {
      id,
      remove: () => removeToast(id),
      update: (props: Partial<CubeNotifyApiProps>) => updateToast(id, props),
    };
  });

  const updateToast = useEvent(
    (id: Key, props: Partial<CubeNotifyApiProps>) => {
      setToasts((toasts) => {
        const currentToast = toasts.get(id);

        if (currentToast) {
          const newToasts = new Map(toasts);
          newToasts.set(id, {
            ...currentToast,
            ...props,
          } as CubeNotifyApiPropsWithID);
          return newToasts;
        }

        return toasts;
      });
    },
  );

  const removeToast = useEvent((id: Key) => {
    setToasts((toasts) => {
      if (toasts.has(id)) {
        const newToasts = new Map(toasts);
        newToasts.delete(id);

        return newToasts;
      }

      return toasts;
    });
  });

  const onDismissNotification = useEvent((id: Key) => {
    const toast = toasts.get(id);

    if (toast?.putNotificationInDropdownOnDismiss !== false) {
      rootRef?.current?.dispatchEvent(
        new CustomEvent(DISMISS_EVENT_NAME, { detail: toast }),
      );
    }
  });

  const addOnDismissListener = useEvent(
    (listener: (toast: CubeNotifyApiProps) => void) => {
      const callback = (e) => listener((e as DismissEvent).detail);

      const unsub = () =>
        rootRef?.current?.removeEventListener(DISMISS_EVENT_NAME, callback);

      listeners.current.push(unsub);
      rootRef?.current?.addEventListener(DISMISS_EVENT_NAME, callback);

      return unsub;
    },
  );

  useEffect(() => () => listeners.current.forEach((cb) => cb()), []);

  const api = useMemo<CubeNotificationsApi>(
    () => ({ notify: addToast, update: updateToast, remove: removeToast }),
    [],
  );

  return {
    api,
    toasts: useMemo(() => [...toasts.values()], [toasts]),
    onDismissNotification,
    addOnDismissListener,
  } as const;
}
