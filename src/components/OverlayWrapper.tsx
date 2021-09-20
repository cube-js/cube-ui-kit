import { Base } from './Base';
import { getOverlayTransitionCSS, OverlayTransitionCSSProps } from '../utils/transitions';
import { CSSTransition } from 'react-transition-group';
import { Styles } from '../styles/types';
import { ReactNode } from 'react';

const OVERLAY_WRAPPER_STYLES: Styles = {
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
  minOffset?: string | number;
  minScale?: string;
  withoutTransition?: boolean;
}

export function OverlayWrapper({
  isOpen,
  placement,
  minOffset,
  minScale,
  withoutTransition,
  children,
  childrenOnly,
}: CubeOverlayWrapperProps) {
  const options: OverlayTransitionCSSProps = {};

  if (typeof minOffset === 'number') {
    minOffset = `${minOffset}px`;
  }

  if (placement != null) {
    options.placement = placement;
  }

  if (minScale != null) {
    options.minScale = minScale;
  }

  if (minOffset != null) {
    options.minOffset = minOffset;
  }

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
          css={withoutTransition ? '' : getOverlayTransitionCSS(options)}
        >
          {children}
        </Base>
      )}
    </CSSTransition>
  );
}
