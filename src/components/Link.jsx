import React, { forwardRef } from 'react';
import Action from './Action';
import { BASE_STYLES, COLOR_STYLES, POSITION_STYLES, TEXT_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';

const DEFAULT_STYLES = {
  display: 'inline',
  cursor: 'pointer',
  size: 'md',
  fontWeight: 500,
  padding: '0',
  radius: {
    '': '0',
    'focused': '1r',
  },
  color: {
    '': '#purple-text',
    hovered: '#purple',
  },
  shadow: {
    '': '0 @border-width 0 0 #purple-03.20',
    'focused': '0 0 0 @outline-width #purple-03',
  },
};

const CSS = `
  white-space: nowrap;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear,
    border-radius var(--transition) linear;
`;

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
  ...TEXT_STYLES,
];

const Link = forwardRef((props, ref) => {
  const { styles, otherProps } = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return (
    <Action
      as="a"
      elementType="a"
      css={CSS}
      {...otherProps}
      styles={styles}
      ref={ref}
    />
  );
});

export default Link;
