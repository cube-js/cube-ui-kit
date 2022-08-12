import { useEffect } from 'react';
import { useToastsApi } from './use-toasts-api';
import { CubeToastsApiProps } from './types';
import { CubeNotifyApiProps } from '../NewNotifications';
import { useId } from '../../../utils/react/useId';

export function Toast(props: CubeToastsApiProps) {
  const { id: propsId } = props;
  const { toast, update, remove } = useToastsApi();
  const defaultId = useId();

  const id = propsId ?? defaultId;

  useEffect(() => {
    toast({ ...props, id });

    return () => remove(id);
  }, [id]);

  useEffect(() => {
    update(id, props as CubeNotifyApiProps);
  });

  return null;
}

Toast.Success = function ToastSuccess(props: CubeToastsApiProps) {
  return <Toast type="success" {...props} />;
};

Toast.Danger = function ToastDanger(props: CubeToastsApiProps) {
  return <Toast type="danger" {...props} />;
};

Toast.Attention = function ToastAttention(props: CubeToastsApiProps) {
  return <Toast type="attention" {...props} />;
};
