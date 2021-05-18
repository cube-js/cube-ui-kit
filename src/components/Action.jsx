import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router';
import {
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import Base from './Base';
import {
  useFocus,
  useFocusVisible,
  useHover,
} from '@react-aria/interactions';
import { useButton } from '@react-aria/button';
import { mergeProps } from '@react-aria/utils';
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
    if (disabled) return;

    if (onClick) {
      onClick();

      return;
    }

    if (!to) return;

    if (evt.shiftKey || evt.metaKey || newTab) {
      openLink(href, true);

      return;
    }

    history.push(href);
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
  margin: 0,
  fontFamily: 'var(--font)',
  size: 'md',
};

export default forwardRef(function Action(
  { to, as, isDisabled, disabled, defaultStyles, htmlType, onPress, onClick, ...props },
  ref,
) {
  as = to ? 'a' : props.as || 'button';

  const newTab = to && to.startsWith('!');
  const href = to ? (newTab ? to.slice(1) : to) : '';
  const target = newTab ? '_blank' : undefined;

  isDisabled = !!(disabled || isDisabled);

  const pressHandler = createLinkClickHandler(to, onClick, isDisabled, as);
  const localRef = useRef();
  const combinedRef = useCombinedRefs(ref, localRef);
  const elementProps = {
    ...props,
    href,
    elementType: as,
    target,
    onPress: onPress || onClick,
    isDisabled,
  };

  useEffect(() => {
    setIsFocused(false);
  }, [isDisabled]);

  let [isFocused, setIsFocused] = useState(false);
  let { focusProps } = useFocus({
    onFocusChange: setIsFocused,
    elementType: as,
  });
  let { buttonProps, isPressed } = useButton(elementProps, combinedRef);
  let { hoverProps, isHovered } = useHover(elementProps);
  let { isFocusVisible } = useFocusVisible({});

  const customProps = {};

  // prevent default behavior for links
  if (to) {
    customProps.onClick = (evt) => {
      evt.preventDefault();

      if (isDisabled) return;

      pressHandler(evt);
    };
  }

  return (
    <Base
      target={newTab ? '_blank' : null}
      href={href || null}
      data-is-hovered={isHovered && !isDisabled ? '' : null}
      data-is-pressed={isPressed && !isDisabled ? '' : null}
      data-is-focused={isFocused && !isDisabled ? '' : null}
      data-is-focus-visible={isFocusVisible && !isDisabled ? '' : null}
      data-is-disabled={isDisabled || null}
      {...mergeProps(buttonProps, hoverProps, focusProps, customProps)}
      {...props}
      tabIndex={props.as === 'button' ? null : '0'}
      styleAttrs={[
        ...COLOR_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        ...TEXT_STYLES,
        ...BLOCK_STYLES,
        ...FLOW_STYLES,
      ]}
      type={htmlType}
      reset="button"
      defaultStyles={{
        ...DEFAULT_STYLES,
        ...defaultStyles,
      }}
      rel={as === 'a' && newTab ? 'rel="noopener noreferrer"' : undefined}
      ref={combinedRef}
      as={as}
    />
  );
});
