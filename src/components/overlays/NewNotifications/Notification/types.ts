import type { ReactNode, HTMLAttributes } from 'react';
import type { NotificationType, CubeNotificationProps } from '../types';

export type NotificationProps = {
  isFocused?: boolean;
  attributes?: HTMLAttributes<HTMLDivElement>;
} & CubeNotificationProps;

export type NotificationIconProps = {
  type: NotificationType;
  icon?: ReactNode;
};
