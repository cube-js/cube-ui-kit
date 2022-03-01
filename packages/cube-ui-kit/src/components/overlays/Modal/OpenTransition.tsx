import { Children, cloneElement } from 'react';
import Transition from 'react-transition-group/Transition';

const OPEN_STATES = {
  entering: false,
  entered: true,
};

export function OpenTransition(props) {
  return (
    <Transition timeout={{ enter: 0, exit: 350 }} {...props}>
      {(state) =>
        Children.map(
          props.children,
          (child) =>
            child && cloneElement(child, { isOpen: !!OPEN_STATES[state] }),
        )
      }
    </Transition>
  );
}
