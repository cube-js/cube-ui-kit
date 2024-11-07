import { ReactElement } from 'react';
import { OverlayProps } from 'react-aria';
import { TransitionStatus as ReactTransitionStatus } from 'react-transition-group';

export type CloseBehavior = 'remove' | 'hide';
export type TransitionStatus = ReactTransitionStatus;

export interface WithCloseBehavior {
  hideOnClose?: boolean;
}

export interface TransitionState {
  transitionState?: TransitionStatus;
}

export interface ModalProps extends Omit<OverlayProps, 'nodeRef'> {
  children: ReactElement;
  isOpen?: boolean;
  onClose?: () => void;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover' | 'panel';
  isDismissable?: boolean;
}
