import { ReactElement } from 'react';
import { OverlayProps } from 'react-aria';

import { ReportedPhase } from '../../helpers/DisplayTransition/DisplayTransition';

export type CloseBehavior = 'remove' | 'hide';
export type TransitionStatus = ReportedPhase;

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
