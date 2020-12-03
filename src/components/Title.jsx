import React from 'react';
import Text from './Text';

export default function Title({ level, ...props }) {
  const tag = `h${level || 1}`;

  return (
    <Text
      as={tag}
      display="block"
      size={tag}
      fontWeight={700}
      color="#dark"
      {...props}
    />
  );
}
