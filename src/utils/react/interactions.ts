import { useState } from 'react';
import { useFocus as reactAriaUseFocus, useFocusVisible } from 'react-aria';

export function useFocus(
  { isDisabled }: { isDisabled?: boolean },
  onlyVisible = false,
) {
  let [isFocused, setIsFocused] = useState(false);
  let { isFocusVisible } = useFocusVisible({});
  let { focusProps } = reactAriaUseFocus({
    isDisabled,
    onFocusChange: setIsFocused,
  });

  return {
    focusProps,
    isFocused:
      !isDisabled && isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
