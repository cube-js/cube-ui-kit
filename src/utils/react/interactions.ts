import { useEffect, useState } from 'react';
import { useFocus as reactAriaUseFocus, useFocusVisible } from 'react-aria';

export function useFocus(
  { isDisabled }: { isDisabled?: boolean },
  onlyVisible = false,
) {
  useEffect(() => {
    setIsFocused(false);
  }, [isDisabled]);

  let [isFocused, setIsFocused] = useState(false);
  let { isFocusVisible } = useFocusVisible({});
  let { focusProps } = reactAriaUseFocus({
    isDisabled,
    // @ts-ignore
    onFocusChange: setIsFocused,
  });

  return {
    focusProps,
    isFocused: isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
