import { OpenTransition } from './OpenTransition';
import { forwardRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from '../../../provider';
import { OverlayProps } from '@react-types/overlays';

export interface CubeOverlayProps extends OverlayProps {}

function Overlay(props: CubeOverlayProps, ref) {
  let {
    children,
    isOpen,
    container,
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited,
  } = props;
  let [exited, setExited] = useState(!isOpen);

  let handleEntered = useCallback(() => {
    setExited(false);
    if (onEntered) {
      onEntered();
    }
  }, [onEntered]);

  let handleExited = useCallback(() => {
    setExited(true);
    if (onExited) {
      onExited();
    }
  }, [onExited]);

  // Don't un-render the overlay while it's transitioning out.
  let mountOverlay = isOpen || !exited;
  if (!mountOverlay) {
    // Don't bother showing anything if we don't have to.
    return null;
  }

  // UNSAFE_style={{background: 'transparent', isolation: 'isolate'}}

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

  return ReactDOM.createPortal(contents, container || document.body);
}

let _Overlay = forwardRef(Overlay);
export { _Overlay as Overlay };
