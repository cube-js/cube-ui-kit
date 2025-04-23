import { Timer } from '../../../../_internal';
import { Styles } from '../../../../tasty';
import { BaseNotificationProps } from '../types';

import type { HTMLAttributes, ReactNode } from 'react';
import type { CubeNotificationType } from '../types';

export type NotificationProps = {
  qa?: string;
  attributes?: HTMLAttributes<HTMLDivElement>;
  styles?: Styles;
  timer?: Timer | null;
  onClose?: () => void;
} & BaseNotificationProps;

export type NotificationIconProps = {
  type: CubeNotificationType;
  icon?: ReactNode;
};
