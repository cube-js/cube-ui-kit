import { TransitionStatus as ReactTransitionStatus } from 'react-transition-group';

export type CloseBehavior = 'remove' | 'hide';
export type TransitionStatus = ReactTransitionStatus;

export interface WithCloseBehavior {
  destroyOnClose?: boolean;
}

export interface TransitionState {
  transitionState?: TransitionStatus;
}
