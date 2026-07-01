import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

import { CaretRect, getCaretRect } from './caretPosition';

export interface CaretAnchorApi {
  updatePosition: () => void;
}

export interface UseCaretAnchorOptions {
  inputRef: RefObject<HTMLTextAreaElement>;
  wrapperRef: RefObject<HTMLElement>;
  caret: number;
  value: string;
  isActive: boolean;
}

export interface UseCaretAnchorResult {
  /** A real (zero-size) element positioned at the caret; used as the popover's
   * geometric anchor. `null` until the wrapper mounts. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Imperative handle to force the popover to re-position. */
  positionApiRef: RefObject<CaretAnchorApi | null>;
}

/**
 * Keeps a zero-size "caret anchor" element positioned at the textarea's caret
 * (both axes), inside the (position: relative) input wrapper. The anchor is a
 * real DOM node so react-aria's `useOverlayPosition` can measure it with
 * `getBoundingClientRect`, while interaction/outside-click stays on the
 * wrapper via a separate `triggerRef`.
 */
export function useCaretAnchor({
  inputRef,
  wrapperRef,
  caret,
  value,
  isActive,
}: UseCaretAnchorOptions): UseCaretAnchorResult {
  const anchorRef = useRef<HTMLElement | null>(null);
  const positionApiRef = useRef<CaretAnchorApi | null>(null);

  // Lazily create the anchor element inside the wrapper and clean it up on
  // unmount. It is not managed by React so the shared TextInputBase structure
  // stays untouched.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const anchor = document.createElement('span');
    anchor.setAttribute('data-caret-anchor', '');
    anchor.style.position = 'absolute';
    anchor.style.top = '0';
    anchor.style.left = '0';
    anchor.style.width = '0';
    anchor.style.height = '0';
    anchor.style.pointerEvents = 'none';
    // Off the flow so it never affects layout or a11y.
    anchor.style.overflow = 'hidden';
    anchor.style.opacity = '0';
    wrapper.appendChild(anchor);
    anchorRef.current = anchor;

    return () => {
      anchor.remove();
      anchorRef.current = null;
    };
  }, [wrapperRef]);

  // Position the anchor at the caret whenever the caret/value/active state
  // changes, then nudge the popover to re-anchor.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const wrapper = wrapperRef.current;
    const input = inputRef.current;
    if (!anchor || !wrapper || !input) return;

    if (!isActive) {
      // Reset to the wrapper's origin when not active so a stale position is
      // never measured if the popover reopens without a caret move.
      anchor.style.transform = 'translate(0px, 0px)';
      return;
    }

    const rect = getCaretRect(input, caret);
    if (!rect) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    // Position relative to the wrapper's border-box (it's position: relative).
    const x = rect.left - wrapperRect.left;
    const y = rect.top - wrapperRect.top;
    anchor.style.transform = `translate(${x}px, ${y}px)`;
    // Give it a real height so cross-axis centering uses the caret line.
    anchor.style.height = `${rect.height}px`;

    positionApiRef.current?.updatePosition();
  }, [caret, value, isActive, inputRef, wrapperRef]);

  return { anchorRef, positionApiRef };
}
