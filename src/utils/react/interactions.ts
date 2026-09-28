import {
  isFocusVisible as getIsFocusVisible,
  useFocusVisibleListener,
} from '@react-aria/interactions';
import { useRef, useState } from 'react';
import { useFocus as reactAriaUseFocus } from 'react-aria';

export function useFocus(
  { isDisabled }: { isDisabled?: boolean },
  onlyVisible = false,
) {
  let [isFocused, setIsFocused] = useState(false);
  let [isFocusVisible, setIsFocusVisible] = useState(false);

  // React-aria detaches focus handlers when disabled, so blur events
  // aren't captured. Clear stale focus synchronously during render
  // to avoid a one-frame glitch (useEffect would be too late).
  if (isDisabled && isFocused) {
    setIsFocused(false);
  }

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

  let { focusProps } = reactAriaUseFocus({
    isDisabled,
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
