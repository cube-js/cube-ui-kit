import React from 'react';
import Text from './Text';
import {
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';

export default function Title({ as, level, ...props }) {
  const tag = `h${level || 1}`;

  return (
    <Text
      as={as || tag}
      display="block"
      size={tag}
      fontWeight={(level || 1) === 1 ? 700 : 600}
      color="#dark"
      styleAttrs={[
        ...TEXT_STYLES,
        ...BLOCK_STYLES,
        ...COLOR_STYLES,
        ...POSITION_STYLES,
      ]}
      {...props}
    />
  );
}
