import React, { forwardRef } from 'react';
import Action from './Action';
import {
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { useCombinedRefs } from '../utils/react';

const DEFAULT_STYLES = {
  display: 'inline-block',
  padding: '1x 2x',
  radius: true,
  size: 'md',
  border: {
    '': '#clear',
    pressed: '#purple-text.15',
    'primary & pressed': '#purple-text',
    'clear & pressed': '#purple-text.10',
    'danger & pressed': '#danger-text',
  },
  fill: {
    ', pressed, pressed & hovered': '#purple.10',
    hovered: '#purple.20',
    'primary, primary & pressed, primary & pressed & hovered': '#purple',
    'primary & hovered': '#purple-text',
    'clear, clear & pressed, clear & pressed & hovered': '#purple.0',
    'clear & hovered': '#purple.05',
    'danger, danger & pressed, danger & pressed & hovered': '#danger',
    'danger & hovered': '#danger-text',
  },
  color: {
    ',hovered': '#purple',
    'primary, primary & hovered, danger, danger & hovered': '#white',
    'clear, clear & hovered': '#purple-text',
  },
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
};
const CSS = `
  position: relative;
  appearance: none;
  outline: none;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear,
    border var(--transition) linear;
  white-space: nowrap;
`;

export default forwardRef(function Button(
  { type, defaultStyles, ...props },
  ref,
) {
  const combinedRef = useCombinedRefs(ref);
  defaultStyles = defaultStyles
    ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
    : DEFAULT_STYLES;

  return (
    <Action
      as="button"
      defaultStyles={defaultStyles}
      styleAttrs={[
        ...COLOR_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        ...TEXT_STYLES,
        ...BLOCK_STYLES,
        'radius',
      ]}
      css={CSS}
      {...{ [`data-is-${type || 'default'}`]: '' }}
      {...props}
      ref={combinedRef}
    />
  );
});
