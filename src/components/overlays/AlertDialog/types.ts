import {
  BaseProps,
  BaseStyleProps,
  BlockStyleProps,
  DimensionStyleProps,
} from '../../types';
import { AriaDialogProps } from '@react-types/dialog';
import { ReactNode } from 'react';
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
}

interface AlertDialogMeta {
  id: number;
  isClosed: boolean;
  promise: Promise<void>;
  placement: 'top' | 'bottom';
  resolve: () => void;
  reject: () => void;
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
