import { ReactElement } from 'react';
import { AriaOverlayProps } from 'react-aria';

import { ReportedPhase } from '../../helpers/DisplayTransition/DisplayTransition';

import { CubeOverlayProps } from './Overlay';

export type CloseBehavior = 'remove' | 'hide';
export type TransitionStatus = ReportedPhase;

export interface WithCloseBehavior {
  hideOnClose?: boolean;
}

export interface TransitionState {
  transitionState?: TransitionStatus;
}

export interface ModalProps extends AriaOverlayProps, CubeOverlayProps {
  children: ReactElement;
  isOpen?: boolean;
  onClose?: () => void;
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover' | 'panel';
  isDismissable?: boolean;
}
