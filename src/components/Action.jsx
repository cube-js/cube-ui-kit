import React, { useState, forwardRef } from 'react';
import { useHistory } from 'react-router';
import Base from './Base';
import { useButton } from '@react-aria/button';
import { useFocusVisible, useHover, useFocus, usePress } from '@react-aria/interactions';
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

export function createLinkClickHandler(ref, to, onClick) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const history = useHistory();
  const newTab = to && to.startsWith('!');
  const href = to ? (newTab ? to.slice(1) : to) : '';

  return function onClickHandler(evt) {
    if (!to || (ref && ref.current && ref.current.hasAttribute('disabled'))) {
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

export default forwardRef(function Action(
  { elementType, to, styles, onClick, ...props },
  ref,
) {
  const combinedRef = useCombinedRefs(ref);

  let [isFocused, setIsFocused] = useState(false);
  let { focusProps } = useFocus({
    onFocusChange: setIsFocused,
    elementType,
  });
  let { pressProps } = usePress({
    onPress(e) {
      if (props.disabled) return;

      if (!to) {
        onClick && onClick(e);
      }
    }
  });
  let { buttonProps, isPressed } = useButton(props, combinedRef);
  let { hoverProps, isHovered } = useHover({});
  let { isFocusVisible } = useFocusVisible({});

  const listeners = {};

  const pressHandler = createLinkClickHandler(combinedRef, to, onClick);

  if (to) {
    listeners.onClick = pressHandler;
    buttonProps.type = undefined;
  }

  styles = { ...styles };

  if (!styles.cursor) {
    styles.cursor = 'pointer';
  }

  if (props.as === 'a') {
    buttonProps.tabIndex = '0';
  }

  return (
    <Base
      data-is-hovered={isHovered ? '' : null}
      data-is-pressed={isPressed ? '' : null}
      data-is-focused={isFocused ? '' : null}
      data-is-focus-visible={isFocusVisible ? '' : null}
      {...buttonProps}
      {...pressProps}
      {...hoverProps}
      {...focusProps}
      {...props}
      {...listeners}
      styles={styles}
      ref={combinedRef}
    />
  );
});
