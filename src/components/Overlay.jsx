import React, {useCallback, useState} from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';

function Overlay(props, ref) {
  let {children, isOpen, container, onEnter, onEntering, onEntered, onExit, onExiting, onExited} = props;
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

  let contents = (
    <CSSTransition
      in={isOpen}
      appear
      onExit={onExit}
      onExiting={onExiting}
      onExited={handleExited}
      onEnter={onEnter}
      onEntering={onEntering}
      onEntered={handleEntered}>
      {children}
    </CSSTransition>
  );

  return ReactDOM.createPortal(contents, container || document.body);
}

let _Overlay = React.forwardRef(Overlay);
export {_Overlay as Overlay};
