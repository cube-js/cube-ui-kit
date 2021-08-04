import { Base } from './Base';
import { getOverlayTransitionCSS } from '../utils/transitions';
import { CSSTransition } from 'react-transition-group';
import { NuStyles } from '../styles/types';
import { ChildrenProp } from './types';

const OVERLAY_WRAPPER_STYLES: NuStyles = {
  position: 'absolute',
  width: '100%',
  top: 0,
  height: '100%',
  zIndex: 999,
};

export interface OverlayWrapperProps {
  isOpen?: boolean;
  placement?: 'top' | 'bottom';
  children: ChildrenProp;
  childrenOnly?: boolean;
}

export function OverlayWrapper({
  isOpen,
  placement,
  children,
  childrenOnly,
}: OverlayWrapperProps) {
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
