import React from 'react';
import { Base } from './Base';
import { getOverlayTransitionCSS } from '../utils/transitions';
import { CSSTransition } from 'react-transition-group';

const OVERLAY_WRAPPER_STYLES = {
  position: 'absolute',
  width: '100%',
  top: 0,
  height: '100%',
  z: 999,
};

export function OverlayWrapper({ isOpen, placement, children, childrenOnly }) {
  return (
    <CSSTransition
      in={isOpen}
      unmountOnExit
      timeout={180}
      classNames="cube-overlay-transition"
    >
      { childrenOnly ? children : <Base
          styles={OVERLAY_WRAPPER_STYLES}
          css={getOverlayTransitionCSS({ placement })}
        >
          {children}
        </Base> }
    </CSSTransition>
  );
}
