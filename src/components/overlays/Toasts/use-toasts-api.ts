import { ReactChild, ReactFragment, useMemo } from 'react';
import { isElement, isFragment } from 'react-is';
import { useNotificationsApi } from '../NewNotifications';
import type { CubeToastsApiProps, CubeToastsApiToastCallback } from './types';
import { CubeToastsApiToastAction, CubeToastsApiToastShortcuts } from './types';

export function useToastsApi() {
  const { notify, update, remove } = useNotificationsApi();

  const toast: CubeToastsApiToastAction = useMemo(
    () =>
      Object.assign<CubeToastsApiToastCallback, CubeToastsApiToastShortcuts>(
        (props) =>
          notify({
            putNotificationInDropdownOnDismiss: false,
            ...unwrapProps(props),
          }),
        {
          success: (props) => toast({ type: 'success', ...unwrapProps(props) }),
          danger: (props) => toast({ type: 'danger', ...unwrapProps(props) }),
          attention: (props) =>
            toast({ type: 'attention', ...unwrapProps(props) }),
        },
      ),
    [],
  );

  return { toast, update, remove } as const;
}

function unwrapProps(props: CubeToastsApiProps | ReactChild | ReactFragment) {
  return {
    ...(propsIsToastProps(props)
      ? {
          isDismissible: props.duration !== null,
          duration: 5_000,
          ...props,
        }
      : { description: props, isDismissible: true, duration: 5_000 }),
  };
}

function propsIsToastProps(
  props: CubeToastsApiProps | ReactChild | ReactFragment,
): props is CubeToastsApiProps {
  const isReactNode =
    isElement(props) ||
    isFragment(props) ||
    typeof props === 'string' ||
    typeof props === 'number';

  return !isReactNode;
}
