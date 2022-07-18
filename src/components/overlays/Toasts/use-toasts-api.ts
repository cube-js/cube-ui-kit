import { ReactChild, ReactFragment, useMemo } from 'react';
import { isElement, isFragment } from 'react-is';
import { useNotificationsApi } from '../NewNotifications';
import type { CubeToastsApiProps } from './types';

export function useToastsApi() {
  const { notify, update, remove } = useNotificationsApi();

  const toast = useMemo(() => {
    const toast = (props: CubeToastsApiProps | ReactChild | ReactFragment) => {
      return notify({
        isDismissible: true,
        putNotificationInDropdownOnDismiss: false,
        duration: 5_000,
        ...unwrapProps(props),
      });
    };

    toast.success = (
      props: Omit<CubeToastsApiProps, 'type'> | ReactChild | ReactFragment,
    ) => toast({ type: 'success', ...unwrapProps(props) });

    toast.danger = (
      props: Omit<CubeToastsApiProps, 'type'> | ReactChild | ReactFragment,
    ) => toast({ type: 'danger', ...unwrapProps(props) });

    toast.attention = (
      props: Omit<CubeToastsApiProps, 'type'> | ReactChild | ReactFragment,
    ) => toast({ type: 'attention', ...unwrapProps(props) });

    return toast;
  }, []);

  return { toast, update, remove } as const;
}

function unwrapProps(props: CubeToastsApiProps | ReactChild | ReactFragment) {
  return {
    ...(propsIsDescription(props)
      ? { description: props }
      : (props as CubeToastsApiProps)),
  };
}

function propsIsDescription(
  props: CubeToastsApiProps | ReactChild | ReactFragment,
) {
  return (
    isElement(props) ||
    isFragment(props) ||
    typeof props === 'string' ||
    typeof props === 'number'
  );
}
