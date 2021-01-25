import React, { forwardRef } from 'react';
import Action from './Action';
import { COLOR_STYLES, POSITION_STYLES, TEXT_STYLES } from '../styles/list';
import { useCombinedRefs } from '../utils/react';

const DEFAULT_STYLES = {
  display: 'inline',
  cursor: 'pointer',
  size: 'md',
  fontWeight: 500,
};

const CSS = `
  position: relative;
  cursor: pointer;
  outline: none;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear,
    border-radius var(--transition) linear;

  &:not([data-is-focused]):not([data-is-hovered]),
  &:not([data-is-focus-visible]):not([data-is-hovered]) {
    box-shadow: 0 var(--border-width) 0 0 rgba(var(--purple-03-color-rgb), 0.2);
  }

  &[data-is-focused][data-is-focus-visible] {
    box-shadow: 0 0 0 var(--outline-width) rgba(var(--purple-03-color-rgb), 1);
    border-radius: var(--radius);
  }

  &:not([data-is-hovered]) {
    color: var(--purple-text-color);
  }

  &[data-is-hovered] {
    color: var(--purple-color);
  }
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
