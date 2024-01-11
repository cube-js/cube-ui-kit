import { forwardRef, HTMLAttributes } from 'react';

import { tasty } from '../../../tasty';

import { TransitionState } from './types';

const UnderlayElement = tasty({
  qa: 'Underlay',
  styles: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9,
    transitionDelay: '0ms',
    opacity: {
      '': 0,
      open: 0.9999,
    },
    pointerEvents: {
      '': 'none',
      open: 'auto',
    },
    fill: '#dark.30',
    overflow: 'hidden',
    transition:
      'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
  },
});

export interface CubeUnderlayProps extends HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
  transitionState?: TransitionState;
}

function Underlay({ isOpen, transitionState, ...otherProps }, ref) {
  return (
    <UnderlayElement
      ref={ref}
      mods={{
        open: isOpen,
      }}
      {...otherProps}
    />
  );
}

let _Underlay = forwardRef(Underlay);
export { _Underlay as Underlay };
