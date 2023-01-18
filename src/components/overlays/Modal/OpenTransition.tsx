import { Children, cloneElement, ReactElement } from 'react';
import { Transition } from 'react-transition-group';

import type { TimeoutProps } from 'react-transition-group/Transition';

const OPEN_STATES = {
  entering: false,
  entered: true,
};

export function OpenTransition(
  props: Omit<TimeoutProps<undefined>, 'timeout'>,
) {
  return (
    <Transition timeout={{ enter: 0, exit: 350 }} {...props}>
      {(state) =>
        Children.map(
          props.children,
          (child) =>
            child &&
            cloneElement(child as ReactElement, {
              isOpen: !!OPEN_STATES[state],
            }),
        )
      }
    </Transition>
  );
}
