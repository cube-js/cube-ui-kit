import { forwardRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { Provider, useProviderProps } from '../../../provider';
import { Props } from '../../../tasty';

import { OpenTransition } from './OpenTransition';
import { WithCloseBehavior } from './types';

import type { OverlayProps } from '@react-types/overlays';

export interface CubeOverlayProps
  extends Omit<OverlayProps, 'container' | 'nodeRef'>,
    WithCloseBehavior {
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
    hideOnClose = false,
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
    if (!hideOnClose) {
      return null;
    }
  }

  let contents = (
    <Provider ref={ref}>
      <OpenTransition
        appear
        in={isOpen}
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
