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

import type { CubeButtonProps } from '../../actions/Button/Button';

export interface Dialog {
  props: DialogProps;
  meta: AlertDialogMeta;
}

/** A confirm or secondary button opened through `useAlertDialogAPI`. */
export interface AlertDialogApiActionProps
  extends Omit<CubeButtonProps, 'onPress'> {
  /**
   * @deprecated Use `onConfirm` or `onSecondary` on the dialog instead. It
   * behaves the same way.
   */
  onPress?: CubeButtonProps['onPress'];
}

export interface AlertDialogApiActions {
  confirm?: AlertDialogApiActionProps | boolean;
  secondary?: AlertDialogApiActionProps;
  cancel?: CubeButtonProps | boolean;
}

export interface DialogProps
  extends Omit<CubeDialogContainerProps, 'onDismiss' | 'children'>,
    Omit<CubeAlertDialogProps, 'type' | 'id' | 'content' | 'actions'> {
  content: ReactNode | (({ resolve, reject }) => ReactNode);
  actions?: AlertDialogApiActions;
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

interface AlertDialogMeta {
  id: number;
  isClosed: boolean;
  promise: Promise<AlertDialogResolveStatus>;
  placement: 'top' | 'bottom';
  resolve: (status: AlertDialogResolveStatus) => void;
  reject: (reason) => void;
  /**
   * Runs the button's `onPress` and the dialog's handler for the action, then
   * resolves with its status.
   */
  act: (status: AlertDialogResolveStatus, onPress?: () => unknown) => void;
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
