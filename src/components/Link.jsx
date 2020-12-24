import React from 'react';
import Action, { createLinkClickHandler } from './Action';
import styled from 'styled-components';
import { COLOR_STYLES, POSITION_STYLES, TEXT_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'inline',
  cursor: 'pointer',
  size: 'md',
};

export default styled(
  React.forwardRef(({ to, onClick, defaultStyles, ...props }, ref) => {
    defaultStyles = defaultStyles
      ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
      : DEFAULT_STYLES;

    const clickHandler = createLinkClickHandler(ref, to, onClick);

    return (
      <Action
        as="a"
        defaultStyles={defaultStyles}
        styleAttrs={[...COLOR_STYLES, ...POSITION_STYLES, ...TEXT_STYLES]}
        elementType="a"
        onClick={clickHandler}
        {...props}
        ref={ref}
      />
    );
  }),
)`
  position: relative;
  cursor: pointer;
  outline: none;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear;

  &:not([data-is-focused]),
  &:not([data-is-focus-visible]) {
    box-shadow: 0 0 0 var(--outline-width) rgba(var(--purple-03-color-rgb), 0);
    border-bottom: var(--border-width) solid
      rgba(var(--purple-text-color-rgb), 0.5);
  }

  &[data-is-focused][data-is-focus-visible] {
    box-shadow: 0 0 0 var(--outline-width) rgba(var(--purple-03-color-rgb), 1);
    border-radius: var(--radius);
  }

  &:not([data-is-hovered]) {
    color: var(--purple-text-color);
  }

  &[data-is-hovered] {
    color: rgba(var(--purple-text-color-rgb), 0.8);
  }
`;
