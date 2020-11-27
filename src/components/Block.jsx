import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
};

export default function Block({ ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['height', 'width', 'place', 'padding', 'border', 'shadow', 'radius', 'grow', 'shrink']}
      {...props}
    />
  );
}
