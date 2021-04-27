import React from 'react';
import THEMES from '../../data/themes';
import Base from '../../components/Base';
import {
  BLOCK_STYLES,
  DIMENSION_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
} from '../../styles/list';

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

export default function Badge({ type, children, ...props }) {
  return (
    <Base
      role="region"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'gap',
        'display',
        ...BLOCK_STYLES,
        ...COLOR_STYLES,
        ...DIMENSION_STYLES,
        ...POSITION_STYLES,
      ]}
      padding={
        typeof children === 'string'
          ? children.length > 2
            ? '0 2px'
            : children.length > 1
            ? '0 1px'
            : 0
          : 0
      }
      fill={THEMES[type] ? THEMES[type].color : '#purple'}
      {...props}
    >
      {children}
    </Base>
  );
}
