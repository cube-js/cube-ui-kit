import React, { useEffect, useState } from 'react';
import {
  useFocus as reactAriaUseFocus,
  useFocusVisible,
} from '@react-aria/interactions';

/**
 * @param isDisabled
 * @param [as]
 * @param [onlyVisible]
 * @return {{isFocused: number, focusProps: React.HTMLAttributes<HTMLElement>}}
 */
export function useFocus({ isDisabled, as }, onlyVisible = false) {
  useEffect(() => {
    setIsFocused(false);
  }, [isDisabled]);

  let [isFocused, setIsFocused] = useState(false);
  let { isFocusVisible } = useFocusVisible({});
  let { focusProps } = reactAriaUseFocus({
    onFocusChange: setIsFocused,
    elementType: as,
  });

  return {
    focusProps,
    isFocused: isFocused & (onlyVisible ? isFocusVisible : true),
  };
}
