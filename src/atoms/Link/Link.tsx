import { forwardRef } from 'react';
import { Action } from '../../components/Action';
import {
  BASE_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useContextStyles } from '../../providers/Styles';

const DEFAULT_STYLES = {
  display: 'inline',
  cursor: 'pointer',
  size: 'md',
  fontWeight: 500,
  padding: '0',
  radius: {
    '': '0',
    focused: '1r',
  },
  color: {
    '': '#purple-text',
    hovered: '#purple',
  },
  shadow: {
    '': '0 @border-width 0 0 #purple-03.20',
    focused: '0 0 0 @outline-width #purple-03',
  },
};

const CSS = `
  white-space: nowrap;
  transition: color var(--transition) linear,
    background var(--transition) linear, box-shadow var(--transition) linear,
    border-radius var(--transition) linear;
  text-decoration: none;
`;

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
  ...TEXT_STYLES,
];

export const Link = forwardRef((props, ref) => {
  const styles = {
    ...DEFAULT_STYLES,
    ...useContextStyles('Link', props),
    ...extractStyles(props, STYLE_PROPS),
  };

  return (
    <Action
      as="a"
      elementType="a"
      css={CSS}
      {...filterBaseProps(props, { eventProps: true })}
      to={props.to}
      styles={styles}
      ref={ref}
    />
  );
});
