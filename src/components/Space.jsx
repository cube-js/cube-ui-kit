import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'flex',
  gap: true,
  items: 'center stretch',
};

export default function Space({ ...props }) {
  if (!props.flow) {
    props.flow = 'row';
  }

  if (props.direction) {
    props.flow = props.direction === 'vertical' ? 'column' : 'row';

    delete props.direction;
  }

  if (props.align) {
    props.items = props.align;

    delete props.align;
  }

  if (!props.items) {
    props.items = props.flow === 'row' ? 'center' : 'stretch';
  }

  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'color',
        'bg',
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
        'grow',
        'shrink',
      ]}
      {...props}
    />
  );
}
