import { OpenTransition } from './OpenTransition';
import { forwardRef, useCallback, useRef, useState } from 'react';
import { Provider } from '../../../provider';
import type { OverlayProps } from '@react-types/overlays';
import { Portal } from '../../portal';

export interface CubeOverlayProps extends Omit<OverlayProps, 'container'> {
  container?: HTMLElement | null;
}

function Overlay(props: CubeOverlayProps, ref) {
  let {
    children,
    isOpen,
    container = null,
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited,
  } = props;
  let [exited, setExited] = useState(!isOpen);
  let containerRef = useRef(container);

  let handleEntered = useCallback(() => {
    setExited(false);
    onEntered?.();
  }, [onEntered]);

  let handleExited = useCallback(() => {
    setExited(true);
    onExited?.();
  }, [onExited]);

  // Don't un-render the overlay while it's transitioning out.
  let mountOverlay = isOpen || !exited;
  if (!mountOverlay) {
    // Don't bother showing anything if we don't have to.
    return null;
  }

  // UNSAFE_style={{background: 'transparent', isolation: 'isolate'}}

  return (
    <Portal root={containerRef}>
      <Provider ref={ref}>
        <OpenTransition
          in={isOpen}
          appear
          onExit={onExit}
          onExiting={onExiting}
          onExited={handleExited}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={handleEntered}
        >
          {children}
        </OpenTransition>
      </Provider>
    </Portal>
  );
}

let _Overlay = forwardRef(Overlay);
export { _Overlay as Overlay };
