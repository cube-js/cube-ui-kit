import {
  createContext,
  Key,
  PropsWithChildren,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import invariant from 'tiny-invariant';
import { NotificationsBar } from './Bar';
import { CubeNotifyApiProps, CubeNotifyApiPropsWithID } from './types';
import { useEvent } from '../../../_internal';
import { Portal } from '../../portal';

type NotificationApi = {
  notify: (props: CubeNotifyApiProps) => {
    id: Key;
    update: (props: Partial<CubeNotifyApiProps>) => void;
    remove: () => void;
  };
  update: (id: Key, props: Partial<CubeNotifyApiProps>) => void;
  remove: (id: Key) => void;
};

const NotificationsContext = createContext<{ api: NotificationApi } | null>(
  null,
);

export function useNotifications() {
  const context = useContext(NotificationsContext);

  invariant(
    context !== null,
    "You can't use Notifications outside of the <Root /> component. Please, check if your component is descendant of <Root/> component",
  );

  return context.api;
}

export function NotificationsProvider(
  props: PropsWithChildren<Record<string, unknown>>,
): JSX.Element {
  const { children } = props;
  const idRef = useRef(0);
  const [toasts, setToasts] = useState<Map<Key, CubeNotifyApiPropsWithID>>(
    new Map(),
  );

  const addToast = useEvent((props: CubeNotifyApiProps) => {
    const nextID = idRef.current++;
    const { id = nextID, duration = 5_000, ...rest } = props;

    setToasts((toasts) => {
      const newToasts = new Map(toasts);
      newToasts.set(id, { id, duration, ...rest });

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
          newToasts.set(id, { ...currentToast, ...props });
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

  const api = useMemo(
    () => ({ notify: addToast, update: updateToast, remove: removeToast }),
    [],
  );

  const providerValue = useMemo(() => ({ api }), []);

  return (
    <NotificationsContext.Provider value={providerValue}>
      <Portal>
        <NotificationsBar
          items={[...toasts.values()]}
          onRemoveToast={removeToast}
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
