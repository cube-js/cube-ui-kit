import { Key, ReactElement, ReactNode } from 'react';
import { NotificationAction, NotificationActionProps } from './Notification';

export type NotificationType = 'success' | 'danger' | 'attention';
export type NotificationActionComponent = ReactElement<
  NotificationActionProps,
  typeof NotificationAction
>;

type NotificationActionType =
  | NotificationActionComponent
  | [NotificationActionComponent]
  | [NotificationActionComponent, NotificationActionComponent];

type NotificationActionCallbackArg = {
  onClose: () => void;
  onDismiss: () => void;
};

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
  isDismissible?: boolean;
  /**
   * Callback fires when a notificaiton is dismissed either by clicking the close button or the timeout.
   */
  onDismiss?: () => void;
  /**
   * Callback fires when a notificaiton is closed by interacting with the notification (via actions)
   */
  onClose?: () => void;
  /**
   * When set to false, notification will not appear in `<NotificaitonsDialog />` when dismissed
   * @default true
   */
  putNotificationInDropdownOnDismiss?: boolean;
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
    | ((arg: NotificationActionCallbackArg) => NotificationActionType)
    | NotificationActionType;
} & (NotificationWithHeader | NotificationWithDescription) &
  (DismissibleNotification | NonDismissibleNotification);

type NotificationWithHeader = {
  header: string;
  description?: string;
};

type NotificationWithDescription = {
  header?: string;
  description: string;
};

type DismissibleNotification = {
  isDismissible: true;
  onDismiss?: () => void;
  duration?: number;
};

type NonDismissibleNotification = {
  isDismissible?: false;
  onDismiss?: never;
  duration?: never;
};

export type CubeNotifyApiProps = CubeNotificationProps;

export type CubeNotifyApiPropsWithID = CubeNotificationProps & {
  id: NonNullable<CubeNotificationProps['id']>;
};

export type CubeNotificationsApi = {
  notify: (props: CubeNotifyApiProps) => {
    id: Key;
    update: (props: Partial<CubeNotifyApiProps>) => void;
    remove: () => void;
  };
  update: (id: Key, props: Partial<CubeNotifyApiProps>) => void;
  remove: (id: Key) => void;
};
