import { ReactChild, ReactFragment, useMemo } from 'react';
import { isElement, isFragment } from 'react-is';
import { useNotificationsApi } from '../NewNotifications';
import type { CubeToastsApiProps, CubeToastsApiToastCallback } from './types';
import { CubeToastsApiToastShortcuts } from './types';

export function useToastsApi() {
  const { notify, update, remove } = useNotificationsApi();

  const toast = useMemo(
    () =>
      Object.assign<CubeToastsApiToastCallback, CubeToastsApiToastShortcuts>(
        (props) =>
          notify({
            isDismissible: true,
            putNotificationInDropdownOnDismiss: false,
            duration: 5_000,
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
