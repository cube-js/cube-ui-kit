import React from 'react';
import Action from './Action';
import styled from 'styled-components';
import {
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';

const DEFAULT_STYLES = {
  display: 'inline-block',
  padding: '1x 2x',
  radius: true,
  cursor: 'pointer',
  size: 'md',
};

export default styled(
  React.forwardRef(({ type, defaultStyles, ...props }, ref) => {
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
          'radius',
        ]}
        data-type={type || 'default'}
        {...props}
        ref={ref}
      />
    );
  }),
)`
  position: relative;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear;

  &:not([data-is-focused]),
  &:not([data-is-focus-visible]) {
    box-shadow: 0 0 0 var(--outline-width) rgba(var(--purple-03-color-rgb), 0);
  }

  &[data-is-focused][data-is-focus-visible] {
    box-shadow: 0 0 0 var(--outline-width) rgba(var(--purple-03-color-rgb), 1);
  }

  &[data-type='default'] {
    color: var(--purple-color);
    border: var(--border-width) solid transparent;

    &:not([data-is-hovered]) {
      background: rgba(var(--purple-color-rgb), 0.1);
    }

    &[data-is-hovered] {
      background: rgba(var(--purple-color-rgb), 0.2);
    }
  }

  &[data-type='primary'] {
    color: var(--white-color);
    border: var(--border-width) solid transparent;

    &:not([data-is-hovered]) {
      background: rgba(var(--purple-color-rgb), 1);
    }

    &[data-is-hovered] {
      background: rgba(var(--purple-color-rgb), 0.9);
    }
  }
`;
