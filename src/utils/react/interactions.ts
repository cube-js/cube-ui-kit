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

  // Tracked while disabled too: an `aria-disabled` control keeps focus, and no
  // focus event fires when it is enabled again. A natively disabled one loses
  // focus, and React Aria reports that blur itself.
  let { focusProps } = reactAriaUseFocus({
    onFocusChange: (focused) => {
      setIsFocused(focused);

      if (focused) {
        setIsFocusVisible(focusVisibleRef.current);
      }
    },
  });

  return {
    focusProps,
    isFocused:
      !isDisabled && isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
