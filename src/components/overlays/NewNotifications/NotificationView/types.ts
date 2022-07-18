import type { ReactNode, HTMLAttributes } from 'react';
import type { CubeNotificationType, CubeNotificationProps } from '../types';
import { Styles } from '../../../../tasty';
import { Timer } from '../../../../_internal';

export type NotificationProps = {
  qa?: string;
  attributes?: HTMLAttributes<HTMLDivElement>;
  styles?: Styles;
  timer?: Timer | null;
  onClose?: () => void;
} & CubeNotificationProps;

export type NotificationIconProps = {
  type: CubeNotificationType;
  icon?: ReactNode;
};
