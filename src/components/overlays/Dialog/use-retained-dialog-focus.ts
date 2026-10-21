import { getFocusableTreeWalker } from '@react-aria/focus';
import { focusSafely } from '@react-aria/interactions';
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { focusProgrammatically } from '../../../utils/react/programmaticFocus';
import { useOpenTransitionContext } from '../Modal/OpenTransitionContext';

import { trapsFocus, useDialogContext } from './context';

/**
 * The event `FocusScope` dispatches on the element it is about to restore
 * focus to. Cancelling it takes the restore over.
 */
const RESTORE_FOCUS_EVENT = 'react-aria-focus-scope-restore';

/** Restores one dialog's unmount has taken over, so no other takes it too. */
const takenOverRestores = new WeakSet<Event>();
/** Set while an unmount redirects a restore, which no other takes over. */
let isRedirectingUnmount = false;

type FocusTarget = HTMLElement | SVGElement;

interface Opener {
  /** The element focused when the dialog opened. */
  element: Element;
  /** The control of the popup `element` sat in, such as a menu's trigger. */
  popupTrigger: Element | null;
  /** That popup. */
  popup: Element | null;
}

/**
 * The popup `element` sits in, while that popup is open, and the control that
 * opened it: a menu and its trigger for one of its items, a popover and its
 * trigger for a button in it. React Aria points such a control at its popup
 * with `aria-controls`.
 */
function findPopup(element: Element) {
  const doc = element.ownerDocument;

  const triggers = doc.querySelectorAll(
    '[aria-haspopup]:not([aria-haspopup="false"])[aria-controls], [aria-expanded="true"][aria-controls]',
  );

  for (const trigger of Array.from(triggers)) {
    for (const id of trigger.getAttribute('aria-controls')!.split(/\s+/)) {
      const popup = id ? doc.getElementById(id) : null;

      if (popup?.contains(element)) return { popupTrigger: trigger, popup };
    }
  }

  return { popupTrigger: null, popup: null };
}

function readOpener(): Opener | null {
  if (typeof document === 'undefined') return null;

  const element = document.activeElement;

  if (!element || element === document.body) return null;

  return { element, ...findPopup(element) };
}

/**
 * Where focus goes back to: the opener, or, once it is gone, the control of
 * the popup it sat in, once that popup has closed too. `FocusScope` hands a
 * restore on the same way when a menu item's menu closes; a disclosure that
 * stays open around a removed control is not one. Only a connected element.
 */
function resolveOpener(opener: Opener | null): FocusTarget | null {
  if (!opener) return null;

  const { element, popupTrigger, popup } = opener;
  const node = element.isConnected
    ? element
    : popupTrigger &&
        (!popup?.isConnected ||
          popupTrigger.getAttribute('aria-expanded') !== 'true')
      ? popupTrigger
      : null;

  // `FocusScope` restores to an SVG opener too, such as a chart mark.
  return node?.isConnected &&
    (node instanceof HTMLElement || node instanceof SVGElement)
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
 * - Opened from a popup that closes as it opens, the dialog keeps focus,
 *   which that popup would restore to its trigger: a dialog that mounts on
 *   open takes that restore over.
 * - Unmounted while open or closing, it restores focus the same way.
 * - Tab past either end moves to the page next to that element, while the
 *   dialog does not trap focus: a panel or a popover that is not dismissable
 *   while open, any dialog during its exit.
 * - A dialog opened from this one takes over its return target: when that
 *   one closes onto this dialog after it has closed, focus goes back where
 *   this one would have sent it.
 *
 * Returns whether the dialog is retained: only a retained dialog renders in
 * the `unmounted` phase.
 */
export function useRetainedDialogFocus(
  dialogRef: RefObject<HTMLElement | null>,
  isFocusInTreeRef: RefObject<boolean>,
) {
  const context = useDialogContext();
  const isOpen = !!context.isOpen;
  const shouldRestoreFocus = context.shouldRestoreFocus ?? true;
  const transitionState = useOpenTransitionContext()?.transitionState;
  const [isRetained, setIsRetained] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const [openedFrom, setOpenedFrom] = useState<Opener | null>(null);
  // What `FocusScope` holds as its own restore target: the element focused
  // when it mounted.
  const [mountedFrom] = useState(() =>
    typeof document === 'undefined' ? null : document.activeElement,
  );
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

  // `FocusScope` takes Tab over whenever it does not trap focus, by the
  // element focused when it mounted: around a dialog that does not trap
  // focus, and around any dialog during its exit.
  const handlesTab =
    isRetained &&
    shouldRestoreFocus &&
    transitionState !== 'unmounted' &&
    !(isOpen && trapsFocus(context));

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

    const activeElement = document.activeElement;

    if (!shouldRestoreFocus || !node) {
      // Nowhere to go: focus left in the hidden dialog is lost, as it is when
      // a dialog unmounts.
      if (activeElement && dialogRef.current?.contains(activeElement)) {
        (activeElement as FocusTarget).blur();
      }

      return;
    }

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

  // Opened from a popup that closes as it opens, as from a popover's button:
  // that popup's `FocusScope` restores to its trigger a frame after it goes,
  // once focus is lost with it. A dialog that mounts on open joins that scope
  // and takes the restore over; this one mounted earlier, so it cancels the
  // restore and keeps focus itself, until a frame after the popup is gone.
  useEffect(() => {
    const dialog = dialogRef.current;
    const { popup, popupTrigger } = openerRef.current ?? {};

    if (!isRetained || !isOpen || !dialog || !popup || !popupTrigger) return;

    const onRestore = (event: Event) => {
      if (event.target !== popupTrigger) return;

      event.preventDefault();
      event.stopPropagation();

      if (!dialog.contains(document.activeElement)) focusSafely(dialog);
    };

    const stop = () => {
      document.removeEventListener(RESTORE_FOCUS_EVENT, onRestore, true);
    };

    // A popup that stays open never restores; stop waiting after its exit.
    const until = Date.now() + 1000;
    let frame = 0;
    let hasCollapsed = false;

    const wait = () => {
      frame = requestAnimationFrame(() => {
        const isExpanded =
          popupTrigger.getAttribute('aria-expanded') === 'true';

        // Reopened: what it restores from now on is its own.
        if (hasCollapsed && isExpanded) {
          stop();

          return;
        }

        if (!isExpanded) hasCollapsed = true;

        if (popup.isConnected && Date.now() < until) {
          wait();
        } else {
          frame = requestAnimationFrame(stop);
        }
      });
    };

    document.addEventListener(RESTORE_FOCUS_EVENT, onRestore, true);
    wait();

    return () => {
      cancelAnimationFrame(frame);
      stop();
    };
  }, [isRetained, isOpen, dialogRef]);

  // Read on unmount: whether a restore then is this hook's, and the dialog.
  const unmountRef = useRef<{
    restores: boolean;
    dialog: HTMLElement | null;
  }>({ restores: false, dialog: null });

  useLayoutEffect(() => {
    unmountRef.current = {
      restores: isRetained && shouldRestoreFocus,
      dialog: dialogRef.current,
    };
  });

  // Unmounted while open or closing, as when what renders it goes:
  // `FocusScope` restores a frame later to the element focused when it
  // mounted, or to what its tree has put in that one's place, or nowhere once
  // that is gone. Focus goes to the opener instead, by `FocusScope`'s own rule:
  // only while focus is in this dialog or in what was opened from it, or
  // lost to `<body>`.
  useLayoutEffect(
    () => () => {
      const opener = openerRef.current;
      const { restores, dialog } = unmountRef.current;

      if (!restores || !opener) return;

      const activeElement = document.activeElement;

      // Focus elsewhere on the page stays there.
      if (
        activeElement !== document.body &&
        !isFocusInTreeRef.current &&
        !dialog?.contains(activeElement)
      ) {
        return;
      }

      let isHandled = false;

      const onRestore = (event: Event) => {
        if (
          isHandled ||
          isRedirectingUnmount ||
          takenOverRestores.has(event) ||
          document.activeElement !== document.body
        ) {
          return;
        }

        const node = resolveOpener(opener);

        if (node === event.target) return;

        isHandled = true;
        takenOverRestores.add(event);
        event.preventDefault();
        event.stopPropagation();

        isRedirectingUnmount = true;
        if (node) restoreFocusTo(node);
        isRedirectingUnmount = false;
      };

      document.addEventListener(RESTORE_FOCUS_EVENT, onRestore, true);
      // Past `FocusScope`'s frame, whichever cleanup scheduled first. With no
      // restore by then and focus still lost, restore it here.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.removeEventListener(RESTORE_FOCUS_EVENT, onRestore, true);

          if (isHandled || document.activeElement !== document.body) return;

          const node = resolveOpener(opener);

          // Another dialog unmounting with this one leaves it alone.
          isRedirectingUnmount = true;
          if (node) restoreFocusTo(node);
          isRedirectingUnmount = false;
        }),
      );
    },
    [isFocusInTreeRef],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isRetained || isOpen || !dialog) return;

    let isRedirecting = false;

    // Capture, ahead of the `FocusScope`s inside, which stop it bubbling.
    const onRestore = (event: Event) => {
      const node = handOffRef.current;

      // A hand-off back into this dialog, or round to it again through
      // another one, would never end.
      if (isRedirecting || !node?.isConnected || dialog.contains(node)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      isRedirecting = true;
      restoreFocusTo(node);
      isRedirecting = false;
    };

    dialog.addEventListener(RESTORE_FOCUS_EVENT, onRestore, true);

    return () => {
      dialog.removeEventListener(RESTORE_FOCUS_EVENT, onRestore, true);
    };
  }, [isRetained, isOpen, dialogRef]);

  useEffect(() => {
    if (!handlesTab) return;

    // Runs on the window, ahead of `FocusScope`'s handler on the document.
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

      if (!dialog || !focused || !dialog.contains(focused)) return;

      const walker = getFocusableTreeWalker(document.body, { tabbable: true });

      walker.currentNode = focused;

      let next = event.shiftKey ? walker.previousNode() : walker.nextNode();

      if (next && dialog.contains(next)) return;

      const opener = resolveOpener(openerRef.current);

      // Without one, Tab moves natively. `FocusScope`'s handler would still
      // go on from the element focused when it mounted, while it is there.
      if (!opener) {
        if (mountedFrom?.isConnected && mountedFrom !== document.body) {
          event.stopPropagation();
        }

        return;
      }

      // `FocusScope`'s handler would go on from that element instead.
      event.preventDefault();
      event.stopPropagation();

      // On from the opener, skipping the dialog in case it follows it.
      walker.currentNode = opener;

      do {
        next = event.shiftKey ? walker.previousNode() : walker.nextNode();
      } while (next && dialog.contains(next));

      if (next) {
        (next as FocusTarget).focus();
      } else if (opener.closest('[role="dialog"], [role="alertdialog"]')) {
        // Nothing after it: back to the opener when it sits in another
        // dialog, as `FocusScope` does when it sits in another scope.
        opener.focus();
      } else {
        (focused as FocusTarget).blur();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handlesTab, dialogRef, mountedFrom]);

  return isRetained;
}
