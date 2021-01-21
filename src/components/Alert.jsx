import React from 'react';
import Base from './Base';
import Text from './Text';
import { BLOCK_STYLES, DIMENSION_STYLES, COLOR_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  padding: '1.5x',
};

const THEMES = {
  success: {
    fill: '#success-bg',
    color: '#success-text',
    border: '#success.40',
  },
  danger: {
    fill: '#danger-bg',
    color: '#danger-text',
    border: '#danger.40',
  },
  note: {
    fill: '#note-bg',
    color: '#note',
    border: '#note.40',
  },
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
      border={THEMES[type] && THEMES[type].border ? THEMES[type].border : '#clear'}
      {...props}
    >
      {children}
    </Base>
  );
}
