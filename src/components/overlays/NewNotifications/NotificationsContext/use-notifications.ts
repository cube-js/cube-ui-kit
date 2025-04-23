import { Key, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../../_internal';
import {
  CubeNotificationsApi,
  CubeNotificationsApiNotifyCallback,
  CubeNotifyApiProps,
  CubeNotifyApiPropsWithID,
} from '../types';

const DISMISS_EVENT_NAME = 'cube:notification:dismiss';
type DismissEvent = CustomEvent<CubeNotifyApiPropsWithID>;

export function useNotifications(
  rootRef: RefObject<HTMLElement | null> | null,
) {
  const idPrefix = useMemo(() => new Date().getTime(), []);
  const idRef = useRef(0);
  const listeners = useRef<(() => void)[]>([]);
  const [notifications, setNotifications] = useState<
    Map<Key, CubeNotifyApiPropsWithID>
  >(new Map());

  const addToast: CubeNotificationsApi['notify'] = Object.assign(
    useEvent<CubeNotificationsApiNotifyCallback>((props) => {
      const nextID = idRef.current++;
      const {
        id = `${idPrefix}_${nextID}`,
        duration,
        isDismissible = true,
        ...rest
      } = props;

      setNotifications((toasts) => {
        const newToasts = new Map(toasts);
        newToasts.set(id, {
          id,
          isDismissible,
          duration: duration ?? (isDismissible ? 5_000 : null),
          ...rest,
        } as CubeNotifyApiPropsWithID);

        return newToasts;
      });

      return {
        id,
        remove: () => removeToast(id),
        update: (props) => updateToast(id, props),
      };
    }),
    {
      success: (props: CubeNotifyApiProps) =>
        addToast({ type: 'success', ...props }),
      danger: (props: CubeNotifyApiProps) =>
        addToast({ type: 'danger', ...props }),
      attention: (props: CubeNotifyApiProps) =>
        addToast({ type: 'attention', ...props }),
    },
  );

  const updateToast = useEvent<CubeNotificationsApi['update']>((id, props) => {
    setNotifications((toasts) => {
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
  });

  const removeToast = useEvent<CubeNotificationsApi['remove']>((id) => {
    setNotifications((toasts) => {
      if (toasts.has(id)) {
        const newToasts = new Map(toasts);
        newToasts.delete(id);

        return newToasts;
      }

      return toasts;
    });
  });

  const onDismissNotification = useEvent((id: Key) => {
    const toast = notifications.get(id);

    if (toast == null) {
      return;
    }

    if (toast?.putNotificationInDropdownOnDismiss !== false) {
      rootRef?.current?.dispatchEvent(
        new CustomEvent(DISMISS_EVENT_NAME, { detail: toast }),
      );
    }
  });

  const addOnDismissListener = useEvent(
    (listener: (notification: CubeNotifyApiPropsWithID) => void) => {
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
    // All deps are stable since we use `useEvent` hook

    [],
  );

  return {
    api,
    notifications: useMemo(() => [...notifications.values()], [notifications]),
    onDismissNotification,
    addOnDismissListener,
  } as const;
}
