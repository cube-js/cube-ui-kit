import { TransitionStatus as ReactTransitionStatus } from 'react-transition-group';

export type CloseBehavior = 'remove' | 'hide';
export type TransitionStatus = ReactTransitionStatus;

export interface WithCloseBehavior {
  closeBehavior?: CloseBehavior;
}

export interface TransitionState {
  transitionState?: TransitionStatus;
}
