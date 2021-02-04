import React, { forwardRef, useState } from 'react';
import { useHistory } from 'react-router';
import Base from './Base';
import { useButton } from '@react-aria/button';
import {
  useFocus,
  useFocusVisible,
  useHover,
  usePress,
} from '@react-aria/interactions';
import { useCombinedRefs } from '../utils/react';

/**
 * Helper to open link.
 * @param {String} href
 * @param {String|Boolean} [target]
 */
export function openLink(href, target) {
  const link = document.createElement('a');

  link.href = href;

  if (target) {
    link.target = target === true ? '_blank' : target;
  }

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

export function createLinkClickHandler(to, onClick, disabled) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const history = useHistory();
  const newTab = to && to.startsWith('!');
  const href = to ? (newTab ? to.slice(1) : to) : '';

  return function onClickHandler(evt) {
    if (!to || disabled) {
      return;
    }

    if (onClick) {
      evt.preventDefault();

      return;
    }

    if (evt.ctrlKey || evt.metaKey || newTab) {
      if (evt.target.tagName !== 'A') {
        openLink(href, true);
      }

      return;
    }

    history.push(href);

    evt.preventDefault();
  };
}

const DEFAULT_STYLES = {
  opacity: {
    '': 1,
    disabled: 0.4,
  },
  cursor: {
    '': 'pointer',
    disabled: 'default',
  },
};

export default forwardRef(function Action(
  { elementType, to, defaultStyles, onClick, ...props },
  ref,
) {
  const combinedRef = useCombinedRefs(ref);

  let [isFocused, setIsFocused] = useState(false);
  let { focusProps } = useFocus({
    onFocusChange: setIsFocused,
    elementType,
  });
  let { pressProps, isPressed } = usePress({
    onPress(e) {
      if (props.disabled) return;

      if (!to) {
        onClick && onClick(e);
      }
    },
  });
  let { buttonProps } = useButton(props, combinedRef);
  let { hoverProps, isHovered } = useHover({});
  let { isFocusVisible } = useFocusVisible({});

  const listeners = {};

  const pressHandler = createLinkClickHandler(to, onClick, props.disabled);

  if (to) {
    listeners.onClick = pressHandler;
    buttonProps.type = undefined;
  }

  if (props.as === 'a') {
    buttonProps.tabIndex = '0';
  }

  return (
    <Base
      data-is-hovered={isHovered && !props.disabled ? '' : null}
      data-is-pressed={isPressed ? '' : null}
      data-is-focused={isFocused ? '' : null}
      data-is-focus-visible={isFocusVisible ? '' : null}
      data-is-disabled={props.disabled || null}
      {...buttonProps}
      {...pressProps}
      {...hoverProps}
      {...focusProps}
      {...props}
      {...listeners}
      disabled={props.disabled || null}
      defaultStyles={{
        ...DEFAULT_STYLES,
        ...defaultStyles,
      }}
      ref={combinedRef}
    />
  );
});
