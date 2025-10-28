import { ReactNode, useRef } from 'react';
import { Placement } from 'react-aria';
import { CSSTransition } from 'react-transition-group';

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
  const nodeRef = useRef<HTMLDivElement>(null);

  const contents = (
    <CSSTransition
      unmountOnExit
      nodeRef={nodeRef}
      in={isOpen}
      timeout={120}
      classNames="cube-overlay-transition"
    >
      <div ref={nodeRef}>{children}</div>
    </CSSTransition>
  );

  return <Portal root={containerRef}>{contents}</Portal>;
}
