import type { Key, ReactNode } from 'react';
import type {
  CubeNotificationType,
  CubeNotifyApiProps,
} from '../NewNotifications';

export type CubeToastsApiProps = {
  description: ReactNode;
  header?: ReactNode;
  id?: Key;
  onDismiss?: () => void;
  duration?: number | null;
  icon?: ReactNode;
  type?: CubeNotificationType;
};

export type CubeToastsApi = {
  toast: CubeToastsApiToastAction;
  update: (id: Key, props: Partial<CubeToastsApiProps>) => void;
  remove: (id: Key) => void;
};

export type CubeToastsApiToastCallback = (
  props: CubeToastsApiProps | ReactNode,
) => {
  id: Key;
  update: (props: Partial<CubeNotifyApiProps>) => void;
  remove: () => void;
};

export type CubeToastsApiToastShortcuts = Record<
  CubeNotificationType,
  CubeToastsApiToastCallback
>;

export type CubeToastsApiToastAction = CubeToastsApiToastCallback &
  CubeToastsApiToastShortcuts;
