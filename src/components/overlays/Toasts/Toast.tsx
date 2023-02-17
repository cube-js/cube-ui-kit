import { Key, useEffect } from 'react';

import { useEvent, useSyncRef } from '../../../_internal';
import { useId } from '../../../utils/react/useId';

import { useToastsApi } from './use-toasts-api';
import { CubeToastsApiProps } from './types';

export type ToastProps = {
  /**
   * If set to true, when the component gets unmounted, notifications will not be removed from the bar
   *
   * @default false
   */
  // eslint-disable-next-line react/boolean-prop-naming
  disableRemoveOnUnmount?: boolean;
} & CubeToastsApiProps;

export function Toast(props: ToastProps) {
  const { id: propsId, disableRemoveOnUnmount } = props;

  const defaultId = useId();
  const disableRemoveOnUnmountRef = useSyncRef(disableRemoveOnUnmount);
  const { toast, update, remove } = useToastsApi();

  const id = propsId ?? defaultId;

  const removeNotification = useEvent((id: Key) =>
    disableRemoveOnUnmountRef.current ? void 0 : remove(id),
  );

  useEffect(() => {
    toast({ id, ...props });
  }, [id]);
  useEffect(() => () => removeNotification(id), [id]);
  useEffect(() => update(id, props));

  return null;
}

Toast.Success = function ToastSuccess(props: ToastProps) {
  return <Toast type="success" {...props} />;
};

Toast.Danger = function ToastDanger(props: ToastProps) {
  return <Toast type="danger" {...props} />;
};

Toast.Attention = function ToastAttention(props: ToastProps) {
  return <Toast type="attention" {...props} />;
};
