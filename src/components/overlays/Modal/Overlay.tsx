import { TastyBatchProvider } from '@tenphi/tasty';
import {
  Children,
  cloneElement,
  forwardRef,
  ReactElement,
  useCallback,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Provider, useProviderProps } from '../../../provider';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';

import { OpenTransitionContext } from './OpenTransitionContext';
import { WithCloseBehavior } from './types';

import type { OverlayProps } from 'react-aria';
import type { Props } from '../../../props';
import type { ReportedPhase } from '../../helpers/DisplayTransition/DisplayTransition';

export interface CubeOverlayProps
  extends Omit<OverlayProps, 'container' | 'nodeRef'>,
    WithCloseBehavior {
  container?: HTMLElement | null;
}

const EXIT_DURATION = 350;

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

  if (isOpen && exited) {
    setExited(false);
  }

  let { root } = useProviderProps({} as Props);

  let handlePhaseChange = useCallback(
    (phase: ReportedPhase) => {
      switch (phase) {
        case 'enter':
          setExited(false);
          onEnter?.();
          onEntering?.();
          break;
        case 'entered':
          onEntered?.();
          break;
        case 'exit':
          onExit?.();
          onExiting?.();
          break;
        case 'unmounted':
          setExited(true);
          onExited?.();
          break;
      }
    },
    [onEnter, onEntering, onEntered, onExit, onExiting, onExited],
  );

  let mountOverlay = isOpen || !exited;

  if (!mountOverlay) {
    if (!hideOnClose) {
      return null;
    }
  }

  let contents = (
    <Provider ref={ref}>
      <DisplayTransition
        isShown={!!isOpen}
        exposeUnmounted={hideOnClose}
        duration={EXIT_DURATION}
        onPhaseChange={handlePhaseChange}
      >
        {({ phase, isShown }) => {
          return (
            <OpenTransitionContext.Provider
              value={{ transitionState: phase as ReportedPhase }}
            >
              {Children.map(
                children,
                (child) =>
                  child &&
                  cloneElement(
                    child as ReactElement,
                    {
                      isOpen: isShown,
                      transitionState: phase,
                    } as any,
                  ),
              )}
            </OpenTransitionContext.Provider>
          );
        }}
      </DisplayTransition>
    </Provider>
  );

  // Popover, Modal and Tray all portal through here, which makes this the
  // overlay path that matters most for batching: a dialog or menu mounts a
  // fresh subtree and react-aria positions it from a layout effect in the same
  // commit. `<Root>` does not re-render for those commits, so open a window
  // here — it flushes in `useInsertionEffect`, before any positioning effect
  // reads the DOM. Note this is a *raw* `createPortal`, not `<Portal>`, so the
  // window `<Portal>` opens does not reach these overlays.
  return createPortal(
    <TastyBatchProvider>{contents}</TastyBatchProvider>,
    container || root || document.body,
  );
}

let _Overlay = forwardRef(Overlay);

_Overlay.displayName = 'Overlay';

export { _Overlay as Overlay };
