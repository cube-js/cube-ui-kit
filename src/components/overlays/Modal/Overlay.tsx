import { OpenTransition } from './OpenTransition';
import { forwardRef, useCallback, useState } from 'react';
import { Provider, useProviderProps } from '../../../provider';
import type { OverlayProps } from '@react-types/overlays';
import { createPortal } from 'react-dom';
import { Props } from '../../../tasty/types';

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
  let { root } = useProviderProps({} as Props);

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

  let contents = (
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
  );

  return createPortal(contents, container || root || document.body);
}

let _Overlay = forwardRef(Overlay);
export { _Overlay as Overlay };
