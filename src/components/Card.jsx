import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  bg: '#white',
  border: true,
  padding: '3x',
};

export default function Card({ ...props }) {
  return (
    <Base
      role="region"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'fill',
        'color',
        'gap',
        'flow',
        'display',
        'height',
        'width',
        'place',
        'padding',
        'border',
        'shadow',
        'radius',
      ]}
      {...props}
    />
  );
}
