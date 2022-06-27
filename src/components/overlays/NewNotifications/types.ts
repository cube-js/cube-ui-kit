import { ReactNode, ReactElement, Key } from 'react';
import { NotificationAction } from './Notification/NotificationAction';

export type NotificationType = 'success' | 'danger' | 'attention';
export type NotificationActionType = ReactElement<
  CubeNotificationActionProps,
  typeof NotificationAction
>;

export type CubeNotificationProps = {
  /**
   * @default 'attention'
   */
  type?: NotificationType;
  /**
   * The delay before the notification hides (in milliseconds) If set to `null`, it will never dismiss.
   */
  duration?: number | null;
  /**
   * ID of the notification. Mostly used when you need to prevent duplicate. By default, we generate a unique id for each notification
   */
  id?: Key;
  /**
   * If true, notification will have the close button.
   * @default true
   */
  isClosable?: boolean;
  onClose?: () => void;
  /**
   * Title of the notification
   */
  header?: string;
  description?: string;
  /**
   * Custom Icon for the notification
   */
  icon?: ReactNode;
  /**
   * Custom Actions in the notification
   */
  actions?: NotificationActionType | NotificationActionType[];
} & (NotificationWithHeader | NotificationWithDescription);

type NotificationWithHeader = {
  header: string;
};

type NotificationWithDescription = {
  description: string;
};

export type CubeNotificationActionProps = {
  onPress: () => void;
};

export type NotificationIconProps = {
  type: NotificationType;
  icon?: ReactNode;
};
