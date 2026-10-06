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

  // No blur reaches React when the focused element is replaced (a tooltip
  // wrapper added or dropped), disabled through a `fieldset` or stripped of its
  // tabIndex. So a focus the element no longer holds is dropped after each
  // render of this control and, when the change came from elsewhere without
  // re-rendering it, on the next key or pointer press React Aria reports (keys
  // typed in a text field don't count).
  let focusedElementRef = useRef<Element | null>(null);

  let dropLostFocus = () => {
    let element = focusedElementRef.current;

    // React Aria's own check, which also looks inside a shadow root.
    if (element && element !== getActiveElement(getOwnerDocument(element))) {
      focusedElementRef.current = null;
      setIsFocused(false);
    }
  };

  // Keep the listener's value, not the raw global modality: react-aria ignores keys
  // typed in a text input, so focus moved after typing there shows no ring.
  let focusVisibleRef = useRef(getIsFocusVisible());
  // Only a focused element takes it into state: updating state on every button
  // re-rendered all of them on each keyboard/pointer switch.
  let isListening = onlyVisible && isFocused;

  useFocusVisibleListener(
    (visible) => {
      focusVisibleRef.current = visible;
      dropLostFocus();

      if (isListening) {
        setIsFocusVisible(visible);
      }
    },
    [isListening],
  );

  useLayoutEffect(() => {
    dropLostFocus();
  });

  let { focusProps } = reactAriaUseFocus({
    onFocus: (event) => {
      focusedElementRef.current = event.target;
    },
    onBlur: () => {
      focusedElementRef.current = null;
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
