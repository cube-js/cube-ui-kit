import React, { forwardRef, useEffect, useState } from 'react';
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

export function createLinkClickHandler(to, onClick, disabled, as) {
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
  { elementType, to, as, defaultStyles, onClick, css, ...props },
  ref,
) {
  as = to ? 'a' : props.as || 'button';

  const combinedRef = useCombinedRefs(ref);
  const pressHandler = createLinkClickHandler(to, onClick, props.disabled, as);

  useEffect(() => {
    setIsFocused(false);
  }, [props.disabled]);

  let [isFocused, setIsFocused] = useState(false);
  let { focusProps } = useFocus({
    onFocusChange: setIsFocused,
    elementType,
  });
  let { pressProps, isPressed } = usePress({
    onPress(e) {
      if (props.disabled) return;

      pressHandler(e);
    },
  });
  let { hoverProps, isHovered } = useHover({});
  let { isFocusVisible } = useFocusVisible({});

  const listeners = {};

  // prevent default behavior for links
  if (to) {
    const pressOnClick = pressProps.onClick;

    pressProps.onClick = (evt) => {
      evt.preventDefault();

      pressOnClick(evt);
    };
  }

  const newTab = to && to.startsWith('!');
  const href = to ? (newTab ? to.slice(1) : to) : '';

  return (
    <Base
      target={newTab ? '_blank' : null}
      href={href || null}
      data-is-hovered={isHovered && !props.disabled ? '' : null}
      data-is-pressed={isPressed ? '' : null}
      data-is-focused={isFocused && !props.disabled ? '' : null}
      data-is-focus-visible={isFocusVisible && !props.disabled ? '' : null}
      data-is-disabled={props.disabled || null}
      {...pressProps}
      {...hoverProps}
      {...focusProps}
      {...props}
      {...listeners}
      tabIndex={props.as === 'button' ? null : '0'}
      styleAttrs={[
        ...COLOR_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        ...TEXT_STYLES,
        ...BLOCK_STYLES,
        ...FLOW_STYLES,
      ]}
      disabled={props.disabled || null}
      defaultStyles={{
        ...DEFAULT_STYLES,
        ...defaultStyles,
      }}
      rel={as === 'a' && newTab ? 'rel="noopener noreferrer"' : undefined}
      css={`
        transition: all var(--transition) linear;
        background: transparent;
        border: none;
        outline: none;
        appearance: none;
        position: relative;
        touch-action: manipulation;
        -webkit-tap-highlight-color: var(--mark-color);
        ${css || ''}
      `}
      ref={combinedRef}
      as={as}
    />
  );
});
