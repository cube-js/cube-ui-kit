import { createContext, useContext } from 'react';

import type { TransitionStatus } from './types';

const OpenTransitionContext = createContext<{
  transitionState: TransitionStatus;
} | null>(null);

export function useOpenTransitionContext() {
  return useContext(OpenTransitionContext);
}

export { OpenTransitionContext };
