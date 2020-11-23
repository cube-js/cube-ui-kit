import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  bg: '#white',
  border: true,
  padding: '2x',
};

export default function Card({ ...props }) {
  return (
    <Base
      role="region"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'flow', 'display', 'height', 'width', 'place', 'padding']}
      {...props}
    />
  );
}
