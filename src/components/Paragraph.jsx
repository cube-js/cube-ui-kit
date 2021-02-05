import React from 'react';
import Text from './Text';

export default function Paragraph({ as, level, ...props }) {
  return (
    <Text as="p" size="text" color="#dark.75" display="block" {...props} />
  );
}
