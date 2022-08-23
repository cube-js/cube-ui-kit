import { Styles } from '../../../../tasty';
import { Timer } from '../../../../_internal';
import { BaseNotificationProps } from '../types';

import type { CubeNotificationType } from '../types';
import type { ReactNode, HTMLAttributes } from 'react';

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
