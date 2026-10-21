import { TastyBatchProvider } from '@tenphi/tasty';
import {
  Children,
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Provider, useProviderProps } from '../../../provider';
import { markFocusRestoreWindow } from '../../../utils/react/programmaticFocus';
import { ButtonSplitContext } from '../../actions/ButtonSplit/context';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';

import { OpenTransitionContext } from './OpenTransitionContext';
import { WithCloseBehavior } from './types';

import type { Props } from '../../../props';
import type { ReportedPhase } from '../../helpers/DisplayTransition/DisplayTransition';

export interface CubeOverlayProps extends WithCloseBehavior {
  children?: ReactNode;
  isOpen?: boolean;
  container?: HTMLElement | null;
  onEnter?: () => void;
  onEntering?: () => void;
  onEntered?: () => void;
  onExit?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
}

/** `Element.moveBefore`, which moves a node and keeps its state. */
type MovableParent = HTMLElement & {
  moveBefore?: (node: Node, child: Node | null) => void;
};

/** How long a closed overlay stays mounted while it plays its exit. */
export const EXIT_DURATION = 350;

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

  // Our `FocusScope` restores focus to the trigger when it unmounts, from
  // inside React's own commit where nothing can wrap the call. The window has
  // to be open before that lands, or the restored trigger's tooltip opens and
  // eats the user's next `Escape` (CUB-4839).
  //
  // Keyed to `isOpen` closing rather than to the exit PHASE, because the phase
  // is not always reported: under reduced motion `DisplayTransition` collapses
  // its duration to zero, so `exit` and `unmounted` are set in one callback and
  // React batches the `exit` render — and its notification — away entirely.
  // Closing is the one signal that always arrives.
  const wasOpen = useRef(!!isOpen);

  if (wasOpen.current !== !!isOpen) {
    wasOpen.current = !!isOpen;

    if (!isOpen) markFocusRestoreWindow(EXIT_DURATION + 200);
  }

  let { root } = useProviderProps({} as Props);

  // A kept overlay mounts along with whatever renders it, and its nodes stay
  // where they were first inserted. One inside another overlay mounts in the
  // same commit and lands before it, so it would open behind it. Each open
  // moves its nodes last in the container, where a fresh mount lands. Only
  // where the browser can move nodes without resetting them: an append would
  // scroll kept content back to the top and reload its frames.
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const start = startRef.current;
    const end = endRef.current;
    const parent = start?.parentElement as MovableParent | null | undefined;

    if (!isOpen || !start || !end || !parent?.moveBefore) return;
    if (parent.lastChild === end) return;

    // Laid out first: content back from `display: none` gets its scroll
    // position back once it has a box again, and a move keeps what the box
    // holds. One forced reflow, once per open that moves.
    void parent.offsetHeight;

    for (let node: ChildNode | null = start; node;) {
      const next: ChildNode | null = node.nextSibling;

      parent.moveBefore(node, null);

      if (node === end) break;

      node = next;
    }
  }, [isOpen]);

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
        {({ phase, isShown, isExiting }) => {
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
                      // A closed overlay leaves React Aria's stack of visible
                      // overlays at once, but stays on screen, and clickable,
                      // while it fades out. A press on it then counts as a
                      // press outside whatever overlay is topmost again, so a
                      // click on a fading list closed the Dialog under it
                      // (CUB-5293). React Aria never treats a press inside a
                      // top-layer element as outside.
                      'data-react-aria-top-layer': isExiting || undefined,
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
  //
  // Overlays also leave the `ButtonSplit` that opened them here: its context
  // crosses the portal and would style every Button inside (CUB-5624). A split
  // rendered inside the overlay still provides its own.
  return createPortal(
    <TastyBatchProvider>
      <ButtonSplitContext.Provider value={null}>
        {hideOnClose && <span ref={startRef} hidden />}
        {contents}
        {hideOnClose && <span ref={endRef} hidden />}
      </ButtonSplitContext.Provider>
    </TastyBatchProvider>,
    container || root || document.body,
  );
}

let _Overlay = forwardRef(Overlay);

_Overlay.displayName = 'Overlay';

export { _Overlay as Overlay };
