import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'grid',
  flow: 'row',
};

export default function Grid({ ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'gap',
        'flow',
        'columns',
        'rows',
        'height',
        'width',
        'place',
        'content',
        'items',
      ]}
      {...props}
    />
  );
}
