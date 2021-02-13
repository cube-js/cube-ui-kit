import React, { forwardRef } from 'react';
import Action from './Action';
import { useCombinedRefs } from '../utils/react';

const STYLES_BY_TYPE = {
  default: {
    border: {
      '': '#clear',
      pressed: '#purple.30',
    },
    fill: {
      ',pressed': '#purple.10',
      hovered: '#purple.20',
    },
    color: '#purple',
  },
  primary: {
    border: {
      '': '#clear',
      pressed: '#purple-text',
    },
    fill: {
      ',pressed': '#purple',
      hovered: '#purple-text',
    },
    color: '#white',
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#purple-text.10',
    },
    fill: {
      ',pressed': '#purple.0',
      hovered: '#purple.05',
    },
    color: '#purple-text',
  },
  danger: {
    border: {
      '': '#clear',
      pressed: '#danger-text',
    },
    fill: {
      ',pressed': '#danger',
      hovered: '#danger-text',
    },
    color: '#white',
  },
  item: {
    border: '#clear',
    fill: {
      '': '#purple.0',
      hovered: '#purple.05',
    },
    color: {
      '': '#dark.75',
      'hovered, focused, pressed': '#purple',
    },
  },
  // not an actual type
  disabled: {
    border: '#clear',
    fill: '#dark.12',
    color: '#dark.50',
  },
};

const STYLES_BY_SIZE = {
  small: {
    padding: '(.75x - 1px) (1.5x - 1px)',
  },
  default: {
    padding: '(1x - 1px) (2x - 1px)',
  },
};

const DEFAULT_STYLES = {
  display: 'inline-block',
  padding: '(.75x - 1px) (1.5x - 1px)',
  radius: true,
  size: 'md',
  outline: {
    '': '#purple-03.0',
    'focused & focus-visible': '#purple-03',
  },
  opacity: {
    '': 1,
    disabled: 0.4,
  },
  cursor: {
    '': 'pointer',
    disabled: 'default',
  },
  fontWeight: 500,
};
const CSS = `
  position: relative;
  appearance: none;
  outline: none;
  transition: all var(--transition) linear;
  white-space: nowrap;
`;

export default forwardRef(function Button(
  { type, size, defaultStyles, ...props },
  ref,
) {
  const combinedRef = useCombinedRefs(ref);
  defaultStyles = defaultStyles
    ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
    : DEFAULT_STYLES;

  return (
    <Action
      elementType={props.to ? 'a' : null}
      defaultStyles={{
        ...defaultStyles,
        ...(STYLES_BY_SIZE[size] || STYLES_BY_SIZE.default),
        ...(props.disabled
          ? STYLES_BY_TYPE.disabled
          : STYLES_BY_TYPE[type] || STYLES_BY_TYPE.default),
      }}
      css={CSS}
      type={type || 'default'}
      {...props}
      ref={combinedRef}
    />
  );
});
