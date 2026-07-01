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
 * synchronous focus shuffles React Aria and portals perform on selection.
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

  const checkFocus = useCallback(() => {
    if (isDisabled) return;

    const activeElement = document.activeElement;
    const isInside =
      (wrapperRef.current?.contains(activeElement) ?? false) ||
      (popoverRef.current?.contains(activeElement) ?? false);

    if (isInside !== wasInsideRef.current) {
      wasInsideRef.current = isInside;
      if (isInside) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    }
  }, [wrapperRef, popoverRef, onFocus, onBlur, isDisabled]);

  const handleFocusOrBlur = useCallback(
    (e: React.FocusEvent) => {
      // Cancel any pending check
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Schedule focus check for next frame
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        checkFocus();
      });
    },
    [checkFocus],
  );

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
      onFocus: handleFocusOrBlur,
      onBlur: handleFocusOrBlur,
    },
  };
}
