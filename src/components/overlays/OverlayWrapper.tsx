import { ReactNode, useRef } from 'react';
import { Placement } from 'react-aria';
import { CSSTransition } from 'react-transition-group';

import { OverlayTransitionCSSProps } from '../../utils/transitions';
import { Portal } from '../portal';

export interface CubeOverlayWrapperProps {
  isOpen?: boolean;
  placement?: Placement;
  children: ReactNode;
  minOffset?: string | number;
  minScale?: string;
  container?: HTMLElement | null;
}

export function OverlayWrapper({
  isOpen,
  placement,
  minOffset,
  minScale,
  children,
  container = null,
}: CubeOverlayWrapperProps) {
  const containerRef = useRef(container);
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
      unmountOnExit
      in={isOpen}
      timeout={120}
      classNames="cube-overlay-transition"
    >
      <>{children}</>
    </CSSTransition>
  );

  return <Portal root={containerRef}>{contents}</Portal>;
}
