import {
  Children,
  cloneElement,
  createContext,
  ReactElement,
  useContext,
  useRef,
} from 'react';
import { Transition } from 'react-transition-group';

import { TransitionStatus } from './types';

import type { TimeoutProps } from 'react-transition-group/Transition';

const OPEN_STATES = {
  entering: false,
  entered: true,
};

export type OpenTransitionProps = Omit<TimeoutProps<undefined>, 'timeout'>;

const OpenTransitionContext = createContext<{
  transitionState: TransitionStatus;
} | null>(null);

export function useOpenTransitionContext() {
  return useContext(OpenTransitionContext);
}

export function OpenTransition(props: OpenTransitionProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Transition nodeRef={nodeRef} timeout={{ enter: 0, exit: 350 }} {...props}>
      {(state) => (
        <div ref={nodeRef}>
          <OpenTransitionContext.Provider value={{ transitionState: state }}>
            {Children.map(
              props.children,
              (child) =>
                child &&
                cloneElement(child as ReactElement, {
                  isOpen: !!OPEN_STATES[state],
                  transitionState: state,
                }),
            )}
          </OpenTransitionContext.Provider>
        </div>
      )}
    </Transition>
  );
}
