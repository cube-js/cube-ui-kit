import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'flex',
  gap: true,
  items: 'center stretch',
};

export default function Flex({ ...props }) {
  props = { ...props };

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

  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'flow', 'height', 'width', 'place', 'content', 'items']}
      {...props}
    />
  );
}
