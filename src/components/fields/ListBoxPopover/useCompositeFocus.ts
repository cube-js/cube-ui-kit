import { FocusEvent, RefObject, useEffect, useRef } from 'react';

import { useEvent } from '../../../_internal';

export interface CompositeBlurInfo {
  /**
   * Focus left for a mousedown outside, and that press has not ended yet. A
   * layout change made now moves the control under the pointer.
   */
  isPressing: boolean;
}

export interface UseCompositeFocusProps {
  wrapperRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLElement>;
  onFocus?: () => void;
  onBlur?: (info: CompositeBlurInfo) => void;
  isDisabled?: boolean;
}

export interface UseCompositeFocusReturn {
  compositeFocusProps: {
    onFocus: (e: FocusEvent) => void;
    onBlur: (e: FocusEvent) => void;
  };
}

/**
 * Tracks focus across a wrapper element and its (portaled) popover as a single
 * logical focus scope. Fires `onFocus` when focus enters either and `onBlur`
 * when it leaves both — essential for components whose overlay is portaled, so
 * that clicking an option does not look like a blur of the whole component.
 *
 * Focus entering is reported as it happens. Focus leaving is too when the blur
 * names where focus went (`relatedTarget`), so it runs before the click that
 * caused it: a Save button sees what leaving the field committed, and an
 * `onFocus` runs before a change made in the same press. A blur to nowhere
 * (a node removed under focus, a programmatic `blur()`, a hop through the
 * body) is checked a frame later, and focus that is back by then reports
 * nothing. One caused by a mousedown outside is final and reported at once:
 * Safari leaves focus nowhere when a button is clicked.
 */
export function useCompositeFocus({
  wrapperRef,
  popoverRef,
  onFocus,
  onBlur,
  isDisabled,
}: UseCompositeFocusProps): UseCompositeFocusReturn {
  const wasInsideRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // Set from an outside mousedown until the task that handles it ends. The
  // focus change is that mousedown's default action, so a blur that sees the
  // flag was caused by it.
  const isPressingOutsideRef = useRef(false);

  const contains = (node: EventTarget | null) =>
    node != null &&
    ((wrapperRef.current?.contains(node as Node) ?? false) ||
      (popoverRef.current?.contains(node as Node) ?? false));

  const cancelCheck = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleDocumentMouseDown = useEvent((e: MouseEvent) => {
    if (contains(e.target)) return;

    isPressingOutsideRef.current = true;
    setTimeout(() => {
      isPressingOutsideRef.current = false;
    }, 0);
  });

  const leave = () => {
    cancelCheck();

    if (!wasInsideRef.current) return;

    wasInsideRef.current = false;
    document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    onBlur?.({ isPressing: isPressingOutsideRef.current });
  };

  const handleFocus = () => {
    // A portaled popover's focus events also bubble to the wrapper through the
    // React tree, so each edge is reported once however many times it arrives.
    if (isDisabled || wasInsideRef.current) return;

    wasInsideRef.current = true;
    document.addEventListener('mousedown', handleDocumentMouseDown, true);
    onFocus?.();
  };

  const handleBlur = (e: FocusEvent) => {
    if (isDisabled) return;

    const next = e.relatedTarget;

    if (next != null || isPressingOutsideRef.current) {
      if (!contains(next)) leave();

      return;
    }

    cancelCheck();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      if (!contains(document.activeElement)) leave();
    });
  };

  // StrictMode unmounts and remounts effects after an `autoFocus` has already
  // reported focus, so the listener focus added is put back here.
  useEffect(() => {
    if (wasInsideRef.current) {
      document.addEventListener('mousedown', handleDocumentMouseDown, true);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, [handleDocumentMouseDown]);

  return {
    compositeFocusProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
  };
}
