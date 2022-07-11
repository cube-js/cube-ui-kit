import { Key, ReactElement, ReactNode } from 'react';
import { NotificationAction, NotificationActionProps } from './Notification';

export type NotificationType = 'success' | 'danger' | 'attention';
export type NotificationActionType = ReactElement<
  NotificationActionProps,
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
  actions?:
    | NotificationActionType
    | [NotificationActionType]
    | [NotificationActionType, NotificationActionType];
} & (NotificationWithHeader | NotificationWithDescription);

type NotificationWithHeader = {
  header: string;
  description?: string;
};

type NotificationWithDescription = {
  header?: string;
  description: string;
};

export type CubeNotifyApiProps = CubeNotificationProps;

export type CubeNotifyApiPropsWithID = CubeNotificationProps & {
  id: NonNullable<CubeNotificationProps['id']>;
};
