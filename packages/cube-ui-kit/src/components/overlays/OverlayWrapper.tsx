import { OverlayTransitionCSSProps } from '../../utils/transitions';
import { CSSTransition } from 'react-transition-group';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useProviderProps } from '../../provider';
import { Props } from '../types';

export interface CubeOverlayWrapperProps {
  isOpen?: boolean;
  placement?: 'start' | 'end' | 'right' | 'left' | 'top' | 'bottom';
  children: ReactNode;
  minOffset?: string | number;
  minScale?: string;
  container?: Element;
}

export function OverlayWrapper({
  isOpen,
  placement,
  minOffset,
  minScale,
  children,
  container,
}: CubeOverlayWrapperProps) {
  let { root } = useProviderProps({} as Props);

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

  const contents = (
    <CSSTransition
      in={isOpen}
      unmountOnExit
      timeout={180}
      classNames="cube-overlay-transition"
    >
      {children}
    </CSSTransition>
  );

  return createPortal(contents, root || container || document.body);
}
