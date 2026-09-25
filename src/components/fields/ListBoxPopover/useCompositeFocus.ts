import React, { RefObject, useCallback, useEffect, useRef } from 'react';

export interface UseCompositeFocusProps {
  wrapperRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLElement>;
  onFocus?: () => void;
  onBlur?: () => void;
  isDisabled?: boolean;
}

export interface UseCompositeFocusReturn {
  compositeFocusProps: {
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
}

/**
 * Tracks focus across a wrapper element and its (portaled) popover as a single
 * logical focus scope. Fires `onFocus` when focus enters either and `onBlur`
 * when it leaves both — essential for components whose overlay is portaled, so
 * that clicking an option does not look like a blur of the whole component.
 *
 * Focus checks are deferred to the next animation frame to tolerate the
 * synchronous focus shuffles React Aria and portals perform on selection. Focus
 * that enters and leaves again within that frame still reports both edges, so a
 * fast focus-type-blur sequence (an automated test, a quick Tab through) does
 * not skip the blur.
 */
export function useCompositeFocus({
  wrapperRef,
  popoverRef,
  onFocus,
  onBlur,
  isDisabled,
}: UseCompositeFocusProps): UseCompositeFocusReturn {
  const wasInsideRef = useRef(false);
  const enteredRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const checkFocus = useCallback(() => {
    const entered = enteredRef.current;

    enteredRef.current = false;

    if (isDisabled) return;

    const activeElement = document.activeElement;
    const isInside =
      (wrapperRef.current?.contains(activeElement) ?? false) ||
      (popoverRef.current?.contains(activeElement) ?? false);

    if (!isInside && !wasInsideRef.current && entered) {
      onFocus?.();
      onBlur?.();

      return;
    }

    if (isInside !== wasInsideRef.current) {
      wasInsideRef.current = isInside;
      if (isInside) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    }
  }, [wrapperRef, popoverRef, onFocus, onBlur, isDisabled]);

  const scheduleCheck = useCallback(() => {
    // Cancel any pending check
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule focus check for next frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      checkFocus();
    });
  }, [checkFocus]);

  const handleFocus = useCallback(() => {
    enteredRef.current = true;
    scheduleCheck();
  }, [scheduleCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    compositeFocusProps: {
      onFocus: handleFocus,
      onBlur: scheduleCheck,
    },
  };
}
