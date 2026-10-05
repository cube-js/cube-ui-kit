import {
  isFocusVisible as getIsFocusVisible,
  useFocusVisibleListener,
} from '@react-aria/interactions';
import { getActiveElement, getOwnerDocument } from '@react-aria/utils';
import { useRef, useState } from 'react';
import { useFocus as reactAriaUseFocus } from 'react-aria';

import { useLayoutEffect } from './useLayoutEffect';

/**
 * Whether the element holds focus, disabled or not: a control that keeps
 * focus while `aria-disabled` still shows where focus is.
 */
export function useFocus(onlyVisible = false) {
  let [isFocused, setIsFocused] = useState(false);
  let [isFocusVisible, setIsFocusVisible] = useState(false);

  // Keep the listener's value, not the raw global modality: react-aria ignores keys
  // typed in a text input, so focus moved after typing there shows no ring.
  let focusVisibleRef = useRef(getIsFocusVisible());
  // Only a focused element takes it into state: updating state on every button
  // re-rendered all of them on each keyboard/pointer switch.
  let isListening = onlyVisible && isFocused;

  useFocusVisibleListener(
    (visible) => {
      focusVisibleRef.current = visible;

      if (isListening) {
        setIsFocusVisible(visible);
      }
    },
    [isListening],
  );

  // No blur reaches React when the focused element is replaced (a tooltip
  // wrapper added or dropped), disabled through a `fieldset` or stripped of its
  // tabIndex, so after each render of this control a focus its element no
  // longer holds is dropped.
  let focusedElementRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    let element = focusedElementRef.current;

    // React Aria's own check, which also looks inside a shadow root.
    if (isFocused && element !== getActiveElement(getOwnerDocument(element))) {
      setIsFocused(false);
    }
  });

  let { focusProps } = reactAriaUseFocus({
    onFocus: (event) => {
      focusedElementRef.current = event.target;
    },
    onFocusChange: (focused) => {
      setIsFocused(focused);

      if (focused) {
        setIsFocusVisible(focusVisibleRef.current);
      }
    },
  });

  return {
    focusProps,
    isFocused: isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
