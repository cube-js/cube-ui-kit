import type { ReactNode, HTMLAttributes } from 'react';
import type { CubeNotificationType } from '../types';
import { Styles } from '../../../../tasty';
import { Timer } from '../../../../_internal';
import { BaseNotificationProps } from '../types';

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
