import {
  BaseProps,
  BaseStyleProps,
  BlockStyleProps,
  DimensionStyleProps,
} from '@tenphi/tasty';
import { ReactNode } from 'react';
import { AriaDialogProps } from 'react-aria';

import { CubeDialogContainerProps } from '../Dialog';

import { CubeAlertDialogProps } from './AlertDialog';

export interface Dialog {
  props: DialogProps;
  meta: AlertDialogMeta;
}

export interface DialogProps
  extends Omit<CubeDialogContainerProps, 'onDismiss' | 'children'>,
    Omit<CubeAlertDialogProps, 'type' | 'id' | 'content'> {
  content: ReactNode | (({ resolve, reject }) => ReactNode);
  /**
   * Runs when the confirm button is pressed. If it returns a promise, the
   * dialog stays open with the button loading until it settles: it closes
   * when the promise resolves, and stays open, with the error reported, when
   * it rejects.
   */
  onConfirm?: () => unknown;
  /** Like `onConfirm`, for the secondary button. */
  onSecondary?: () => unknown;
  /**
   * Runs when the dialog settles as a cancel: the Cancel button, Escape, a
   * click outside, an aborted `cancelToken`, or `content` calling `reject()`.
   */
  onCancel?: () => void;
}

export type AlertDialogResolveStatus = 'confirm' | 'secondary';

/** What `open` resolves with when `resolveOnCancel` is on. */
export type AlertDialogStatus = AlertDialogResolveStatus | 'cancel';

interface AlertDialogMeta {
  id: number;
  isClosed: boolean;
  promise: Promise<AlertDialogStatus>;
  placement: 'top' | 'bottom';
  resolve: (status: AlertDialogResolveStatus) => void;
  reject: (reason) => void;
  /** Runs the action's handler, then resolves with its status. */
  act: (status: AlertDialogResolveStatus) => void;
  isVisible?: boolean;
  dialogType?: 'info' | 'confirm' | 'form';
}

export interface CubeDialogProps
  extends Omit<BaseProps, 'role'>,
    AriaDialogProps,
    BaseStyleProps,
    BlockStyleProps,
    DimensionStyleProps {
  /** The type of the dialog. It affects its size and position. */
  type?:
    | 'modal'
    | 'popover'
    | 'fullscreen'
    | 'fullscreenTakeover'
    | 'panel'
    | 'tray';
  /** The size of the dialog */
  size?: 'S' | 'M' | 'L';
  /** Whether the dialog is dismissable */
  isDismissable?: boolean;
  /** Trigger when the dialog is dismissed */
  onDismiss?: (arg?: any) => void;
  /** That you can replace the close icon with */
  closeIcon?: ReactNode;
}
