import React from 'react';
import Text from './Text';
import {
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';

export default function Paragraph({ as, level, ...props }) {
  return (
    <Text
      as="p"
      size="text"
      color="#dark.75"
      display="block"
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
