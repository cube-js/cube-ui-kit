import React, { useRef, useState } from 'react';
import Base from './Base';
import { useButton } from '@react-aria/button';
import { useFocusVisible, useHover, useFocus } from '@react-aria/interactions';

export default React.forwardRef(function Action(props, ref) {
  let [isFocused, setIsFocused] = useState(false);
  let { focusProps } = useFocus({
    onFocusChange: setIsFocused,
  });
  let { buttonProps, isPressed } = useButton(props, ref);
  let { hoverProps, isHovered } = useHover({});
  let { isFocusVisible } = useFocusVisible({});

  return (
    <Base
      data-is-hovered={isHovered ? '' : null}
      data-is-pressed={isPressed ? '' : null}
      data-is-focused={isFocused ? '' : null}
      data-is-focus-visible={isFocusVisible ? '' : null}
      {...hoverProps}
      {...buttonProps}
      {...focusProps}
      {...props}
      ref={ref}
    />
  );
});
