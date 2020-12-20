import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'flex',
};

export default function Flex({ ...props }) {
  if (!props.flow) {
    props.flow = 'row';
  }

  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'fill',
        'color',
        'gap',
        'flow',
        'height',
        'width',
        'place',
        'content',
        'items',
        'padding',
        'border',
        'shadow',
        'radius',
      ]}
      {...props}
    />
  );
}
