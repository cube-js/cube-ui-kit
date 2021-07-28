import React, { forwardRef } from 'react';
import THEMES from '../../data/themes';
import { Base } from '../../components/Base';
import {
  BLOCK_STYLES,
  DIMENSION_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  FLOW_STYLES,
  BASE_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'inline-flex',
  content: 'center',
  items: 'center',
  radius: 'round',
  size: '12px 12px',
  width: 'min 16px',
  height: '16px',
  textAlign: 'center',
  fontWeight: 600,
  color: '#white',
};

const STYLE_LIST = [
  ...BASE_STYLES,
  ...FLOW_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
];

export const Badge = forwardRef(({ type, children, ...props }, ref) => {
  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    padding:
      typeof children === 'string'
        ? children.length > 2
          ? '0 2px'
          : children.length > 1
          ? '0 1px'
          : 0
        : 0,
    fill: THEMES[type] ? THEMES[type].color : '#purple',
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    >
      {children}
    </Base>
  );
});
