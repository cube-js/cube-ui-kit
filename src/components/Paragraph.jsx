import React from 'react';
import Text from './Text';

export default function Paragraph({ as, level, ...props }) {
  return <Text as="p" color="#dark-65" display="block" {...props} />;
}
