import { useEffect } from 'react';
import { useToastsApi } from './use-toasts-api';
import { CubeToastsApiProps } from './types';
import { useId } from '../../../utils/react/useId';

export type ToastProps = {
  /**
   * If set to true, when the component gets unmounted, notifications will not be removed from the bar
   *
   * @default false
   */
  disableRemoveOnUnmount?: boolean;
} & CubeToastsApiProps;

export function Toast(props: ToastProps) {
  const { id: propsId, disableRemoveOnUnmount } = props;
  const { toast, update, remove } = useToastsApi();
  const defaultId = useId();

  const id = propsId ?? defaultId;

  useEffect(() => {
    toast({ id, ...props });
  }, [id]);

  useEffect(() => {
    if (disableRemoveOnUnmount) {
      return;
    }

    return () => remove(id);
  }, []);

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
