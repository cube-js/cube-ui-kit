import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  bg: '#white',
};

export default function Card({ ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'flow', 'display']}
      {...props}
    />
  );
}
