import { Children, cloneElement } from 'react';
import { Transition } from 'react-transition-group';

const OPEN_STATES = {
  entering: false,
  entered: true,
};

/**
 * Timeout issues adding css animations to enter may be related to
 * https://github.com/reactjs/react-transition-group/issues/189 or
 * https://github.com/reactjs/react-transition-group/issues/22
 * my VM isn't good enough to debug accurately and get a better answer.
 *
 * As a result, use enter 0 so that is-open is applied once entered
 * it doesn't matter if we know when the css-animation is done on entering
 * for exiting though, give time for the css-animation to play
 * before removing from the DOM
 * **note** hitting esc bypasses exit animation for anyone testing.
 */

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
