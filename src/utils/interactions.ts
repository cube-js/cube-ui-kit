import { useEffect, useState } from 'react';
import {
  FocusProps,
  useFocus as reactAriaUseFocus,
  useFocusVisible,
} from '@react-aria/interactions';

export function useFocus({ isDisabled }: FocusProps, onlyVisible = false) {
  useEffect(() => {
    setIsFocused(false);
  }, [isDisabled]);

  let [isFocused, setIsFocused] = useState(false);
  let { isFocusVisible } = useFocusVisible({});
  let { focusProps } = reactAriaUseFocus({
    onFocusChange: setIsFocused,
  });

  return {
    focusProps,
    isFocused: isFocused && (onlyVisible ? isFocusVisible : true),
  };
}
