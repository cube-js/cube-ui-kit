import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
};

export default function Flow({ ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'height', 'width', 'place']}
      {...props}
    />
  );
}
