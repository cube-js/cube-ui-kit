import { useState } from 'react';
import { useFocus as reactAriaUseFocus, useFocusVisible } from 'react-aria';

export function useFocus(
  { isDisabled }: { isDisabled?: boolean },
  onlyVisible = false,
) {
  let [isFocused, setIsFocused] = useState(false);

  // React-aria detaches focus handlers when disabled, so blur events
  // aren't captured. Clear stale focus synchronously during render
  // to avoid a one-frame glitch (useEffect would be too late).
  if (isDisabled && isFocused) {
    setIsFocused(false);
  }

  let { isFocusVisible } = useFocusVisible({});
  let { focusProps } = reactAriaUseFocus({
    isDisabled,
    onFocusChange: setIsFocused,
  });

  return {
    focusProps,
    isFocused: isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
