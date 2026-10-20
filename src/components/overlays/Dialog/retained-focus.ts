import { getFocusableTreeWalker } from '@react-aria/focus';
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { focusProgrammatically } from '../../../utils/react/programmaticFocus';
import { useOpenTransitionContext } from '../Modal/OpenTransitionContext';

/**
 * The event `FocusScope` dispatches on the element it is about to restore
 * focus to. Cancelling it takes the restore over.
 */
const RESTORE_FOCUS_EVENT = 'react-aria-focus-scope-restore';

type FocusTarget = HTMLElement | SVGElement;

interface Opener {
  /** The element focused when the dialog opened. */
  element: Element;
  /** The control of the popup `element` sat in, such as a menu's trigger. */
  popupTrigger: Element | null;
}

/**
 * The control that opened the popup `element` sits in, while that popup is
 * open: a menu's trigger for one of its items. React Aria points such a
 * control at its popup with `aria-controls`.
 */
function findPopupTrigger(element: Element) {
  const doc = element.ownerDocument;

  const triggers = doc.querySelectorAll('[aria-haspopup][aria-controls]');

  for (const trigger of Array.from(triggers)) {
    if (trigger.getAttribute('aria-haspopup') === 'false') continue;

    for (const id of trigger.getAttribute('aria-controls')!.split(/\s+/)) {
      if (id && doc.getElementById(id)?.contains(element)) return trigger;
    }
  }

  return null;
}

function readOpener(): Opener | null {
  if (typeof document === 'undefined') return null;

  const element = document.activeElement;

  if (!element || element === document.body) return null;

  return { element, popupTrigger: findPopupTrigger(element) };
}

/**
 * Where focus goes back to: the opener, or, once it is gone, the control of
 * the popup it sat in. `FocusScope` hands a restore on the same way when a
 * menu item's menu closes. Only a connected element that takes focus.
 */
function resolveOpener(opener: Opener | null): FocusTarget | null {
  if (!opener) return null;

  const node = opener.element.isConnected
    ? opener.element
    : opener.popupTrigger;

  if (!node?.isConnected || node === node.ownerDocument.body) return null;

  // `FocusScope` restores to an SVG opener too, such as a chart mark.
  return node instanceof HTMLElement || node instanceof SVGElement
    ? node
    : null;
}

/**
 * Restores focus the way `FocusScope` does, announcing it first: a retained
 * dialog closed around `node` takes the restore on to its own opener.
 */
function restoreFocusTo(node: FocusTarget) {
  const event = new CustomEvent(RESTORE_FOCUS_EVENT, {
    bubbles: true,
    cancelable: true,
  });

  if (node.dispatchEvent(event)) {
    focusProgrammatically(node, { preventScroll: true });
  }
}

/**
 * Keeps focus moving for a retained dialog (`hideOnClose`) as it moves for a
 * dialog that mounts on open. Its `FocusScope` mounts once, while the dialog
 * is still closed, and a dialog that never unmounts gets none of what that
 * scope does with the element focused on open:
 *
 * - On close, focus returns to that element, at the end of the exit, by the
 *   same rule: only while focus is still in the dialog, lost to `<body>`, or
 *   left in another overlay that is closing.
 * - When that element is gone by the close, as a menu item goes with its
 *   menu, focus goes to the control of the popup it sat in instead.
 * - Tab past either end of a dialog that does not trap focus (a panel, a
 *   popover that is not dismissable) moves to the page next to that element.
 * - A dialog opened from this one takes over its return target: when that
 *   one closes onto this dialog after it has closed, focus goes back where
 *   this one would have sent it.
 *
 * Returns whether the dialog is retained: only a retained dialog renders in
 * the `unmounted` phase.
 */
export function useRetainedDialogFocus(
  dialogRef: RefObject<HTMLElement | null>,
  {
    isOpen,
    shouldRestoreFocus,
    containsFocus,
  }: {
    isOpen: boolean;
    shouldRestoreFocus: boolean;
    /** Whether the dialog keeps Tab inside it while open. */
    containsFocus: boolean;
  },
) {
  const transitionState = useOpenTransitionContext()?.transitionState;
  const [isRetained, setIsRetained] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const [openedFrom, setOpenedFrom] = useState<Opener | null>(null);
  const openerRef = useRef<Opener | null>(null);
  // Where a restore aimed into the closed dialog goes instead.
  const handOffRef = useRef<FocusTarget | null>(null);

  if (transitionState === 'unmounted' && !isRetained) setIsRetained(true);

  // Read in the render that opens it, as `FocusScope` reads it: the commit can
  // move focus before any effect runs, into the dialog (a native `autoFocus`,
  // a child's layout effect) or to `<body>` (an opener it disables). The
  // popup's control is read now too: its `aria-controls` goes as that popup
  // closes. Cleared on close, so a closed dialog holds no removed opener.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setOpenedFrom(isOpen ? readOpener() : null);
  }

  useLayoutEffect(() => {
    if (!isOpen) return;

    handOffRef.current = null;

    // A reopen during the exit keeps its opener while focus is still inside
    // or already lost to `<body>`, as `FocusScope` keeps its own.
    if (openedFrom && !dialogRef.current?.contains(openedFrom.element)) {
      openerRef.current = openedFrom;
    }
  }, [isOpen, dialogRef, openedFrom]);

  useEffect(() => {
    if (transitionState !== 'unmounted') return;

    const node = resolveOpener(openerRef.current);

    openerRef.current = null;

    if (!shouldRestoreFocus || !node) return;

    const activeElement = document.activeElement;
    // Also lost when left in another overlay that closes with this one: a
    // nested dialog's own restore target is about to be hidden. `Overlay`,
    // `Select` and `ListBoxPopover` mark a closing overlay `="true"`; the
    // notifications layer carries it empty. React Aria's toast region also
    // carries `"true"`, but nothing in the kit renders one.
    const isFocusLost =
      !activeElement ||
      activeElement === document.body ||
      !!dialogRef.current?.contains(activeElement) ||
      !!activeElement.closest('[data-react-aria-top-layer="true"]');

    if (isFocusLost) {
      restoreFocusTo(node);
    } else {
      // Focus is in a dialog opened from this one, or somewhere the user
      // chose. If that dialog restores into this one, focus comes here.
      handOffRef.current = node;
    }
  }, [transitionState, shouldRestoreFocus, dialogRef]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isRetained || isOpen || !dialog) return;

    // Capture, ahead of the `FocusScope`s inside, which stop it bubbling.
    const onRestore = (event: Event) => {
      const node = handOffRef.current;

      if (!node?.isConnected) return;

      event.preventDefault();
      event.stopPropagation();
      restoreFocusTo(node);
    };

    dialog.addEventListener(RESTORE_FOCUS_EVENT, onRestore, true);

    return () => {
      dialog.removeEventListener(RESTORE_FOCUS_EVENT, onRestore, true);
    };
  }, [isRetained, isOpen, dialogRef]);

  useEffect(() => {
    if (!isRetained || !isOpen || containsFocus) return;

    // `FocusScope`'s own handler reads the element focused when it mounted,
    // closed. Runs on the window, ahead of that document-level one.
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Tab' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing
      ) {
        return;
      }

      const dialog = dialogRef.current;
      const focused = document.activeElement;
      const opener = resolveOpener(openerRef.current);

      if (!dialog || !opener || !focused || !dialog.contains(focused)) return;

      const walker = getFocusableTreeWalker(document.body, { tabbable: true });

      walker.currentNode = focused;

      let next = event.shiftKey ? walker.previousNode() : walker.nextNode();

      if (next && dialog.contains(next)) return;

      // Past the dialog's edge: on from its opener, skipping the dialog in
      // case it follows the opener.
      walker.currentNode = opener;

      do {
        next = event.shiftKey ? walker.previousNode() : walker.nextNode();
      } while (next && dialog.contains(next));

      event.preventDefault();
      event.stopPropagation();

      if (next) {
        (next as FocusTarget).focus();
      } else {
        (focused as FocusTarget).blur();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isRetained, isOpen, containsFocus, dialogRef]);

  return isRetained;
}
