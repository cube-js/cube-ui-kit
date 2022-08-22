import { Key, ReactChild, ReactElement, ReactFragment, ReactNode } from 'react';

import {
  NotificationAction,
  NotificationActionProps,
} from './NotificationView';

export type CubeNotificationType = 'success' | 'danger' | 'attention';
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

export type BaseNotificationProps = {
  /**
   * @default 'attention'
   */
  type?: CubeNotificationType;
  /**
   * The delay before the notification hides (in milliseconds) If set to `null`, it will never dismiss.
   *
   * @default 5000
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
  header?: ReactChild | ReactFragment;
  description: ReactChild | ReactFragment;
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
};

export type CubeNotificationProps = BaseNotificationProps;

export type CubeNotifyApiProps = {
  meta?: CubeNotificationMeta;
} & CubeNotificationProps;

export type CubeNotifyApiPropsWithID = {
  id: NonNullable<CubeNotificationProps['id']>;
} & CubeNotifyApiProps;

export type CubeNotificationsApiNotifyCallback = (
  props: CubeNotifyApiProps,
) => {
  id: Key;
  update: (props: Partial<CubeNotifyApiProps>) => void;
  remove: () => void;
};

export type CubeNotificationsApiNotifyAction =
  CubeNotificationsApiNotifyCallback &
    Record<CubeNotificationType, CubeNotificationsApiNotifyCallback>;

export type CubeNotificationsApi = {
  notify: CubeNotificationsApiNotifyAction;
  update: (id: Key, props: Partial<CubeNotifyApiProps>) => void;
  remove: (id: Key) => void;
};

export type CubeNotificationMeta = Record<string, unknown>;
