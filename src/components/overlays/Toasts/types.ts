import { Key, ReactChild, ReactFragment, ReactNode } from 'react';
import { CubeNotificationType, CubeNotifyApiProps } from '../NewNotifications';

export type CubeToastsApiProps = {
  description: ReactChild | ReactFragment;
  header?: ReactChild | ReactFragment;
  id?: Key;
  onDismiss?: () => void;
  duration?: number;
  icon?: ReactNode;
  type?: CubeNotificationType;
};

export type CubeToastsApi = {
  toast: CubeToastsApiToastAction;
  update: (id: Key, props: Partial<CubeToastsApiProps>) => void;
  remove: (id: Key) => void;
};

export type CubeToastsApiToastCallback = (
  props: CubeToastsApiProps | ReactChild | ReactFragment,
) => {
  id: Key;
  update: (props: Partial<CubeNotifyApiProps>) => void;
  remove: () => void;
};

export type CubeToastsApiToastShortcuts = {
  success: CubeToastsApiToastCallback;
  danger: CubeToastsApiToastCallback;
  attention: CubeToastsApiToastCallback;
};

export type CubeToastsApiToastAction = CubeToastsApiToastCallback &
  CubeToastsApiToastShortcuts;
