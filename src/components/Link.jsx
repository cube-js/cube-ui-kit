import React, { forwardRef } from 'react';
import Action from './Action';
import { COLOR_STYLES, POSITION_STYLES, TEXT_STYLES } from '../styles/list';
import { useCombinedRefs } from '../utils/react';

const DEFAULT_STYLES = {
  display: 'inline',
  cursor: 'pointer',
  size: 'md',
  fontWeight: 500,
  radius: {
    '': '0',
    'focused & focus-visible': '1r',
  },
  color: {
    '': '#purple-text',
    'hovered': '#purple',
  },
  shadow: {
    '': '0 @border-width 0 0 #purple-03.20',
    'focused & focus-visible': '0 0 0 @outline-width #purple-03',
  },
};

const CSS = `
  position: relative;
  outline: none;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear,
    border-radius var(--transition) linear;
`;

export default forwardRef(({ to, defaultStyles, ...props }, ref) => {
  const combinedRef = useCombinedRefs(ref);

  defaultStyles = defaultStyles
    ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
    : DEFAULT_STYLES;

  const newTab = to && to.startsWith('!');
  const href = to ? (newTab ? to.slice(1) : to) : '';

  return (
    <Action
      as="a"
      to={to}
      target={newTab ? '_blank' : null}
      href={href || null}
      defaultStyles={defaultStyles}
      styleAttrs={[...COLOR_STYLES, ...POSITION_STYLES, ...TEXT_STYLES]}
      elementType="a"
      css={CSS}
      {...props}
      ref={combinedRef}
    />
  );
});
