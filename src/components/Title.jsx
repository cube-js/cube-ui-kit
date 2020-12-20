import React from 'react';
import Text from './Text';

export default function Title({ as, level, ...props }) {
  const tag = `h${level || 1}`;

  return (
    <Text
      as={as || tag}
      display="block"
      size={tag}
      fontWeight={700}
      color="#dark"
      {...props}
    />
  );
}
