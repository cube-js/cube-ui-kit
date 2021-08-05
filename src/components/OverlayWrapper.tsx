import { Base } from './Base';
import { getOverlayTransitionCSS } from '../utils/transitions';
import { CSSTransition } from 'react-transition-group';
import { NuStyles } from '../styles/types';
import { ReactNode } from 'react';

const OVERLAY_WRAPPER_STYLES: NuStyles = {
  position: 'absolute',
  width: '100%',
  top: 0,
  height: '100%',
  zIndex: 999,
};

export interface CubeOverlayWrapperProps {
  isOpen?: boolean;
  placement?: 'start' | 'end' | 'right' | 'left' | 'top' | 'bottom';
  children: ReactNode;
  childrenOnly?: boolean;
}

export function OverlayWrapper({
  isOpen,
  placement,
  children,
  childrenOnly,
}: CubeOverlayWrapperProps) {
  return (
    <CSSTransition
      in={isOpen}
      unmountOnExit
      timeout={180}
      classNames="cube-overlay-transition"
    >
      {childrenOnly ? (
        children
      ) : (
        <Base
          styles={OVERLAY_WRAPPER_STYLES}
          css={getOverlayTransitionCSS({ placement })}
        >
          {children}
        </Base>
      )}
    </CSSTransition>
  );
}
