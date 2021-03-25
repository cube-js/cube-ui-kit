import React from 'react';
import Base from '../../components/Base';
import THEMES from '../../data/themes';
import {
  BLOCK_STYLES,
  DIMENSION_STYLES,
  COLOR_STYLES,
} from '../../styles/list';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  padding: '1.5x',
};

export default function Alert({ type, label, children, ...props }) {
  type = type || 'note';

  return (
    <Base
      role="region"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'gap',
        'flow',
        'display',
        ...BLOCK_STYLES,
        ...COLOR_STYLES,
        ...DIMENSION_STYLES,
      ]}
      fill={THEMES[type] ? THEMES[type].fill : '#clear'}
      border={
        THEMES[type] && THEMES[type].border ? THEMES[type].border : '#clear'
      }
      color="#dark"
      {...props}
    >
      {children}
    </Base>
  );
}
