import { Key, ReactNode } from 'react';
import { CubeNotificationType } from '../NewNotifications';

export type CubeToastsApiProps = {
  description: ReactNode;
  id?: Key;
  onDismiss?: () => void;
  duration?: number;
  icon?: ReactNode;
  type?: CubeNotificationType;
};
