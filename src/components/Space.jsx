import React, { forwardRef } from 'react';
import Base from './Base';
import {
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  BLOCK_STYLES,
  FLOW_STYLES,
} from '../styles/list';

const DEFAULT_STYLES = {
  display: 'flex',
  gap: true,
  items: 'center stretch',
};

export default forwardRef(function Space({ ...props }, ref) {
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
      ref={ref}
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        ...COLOR_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        ...BLOCK_STYLES,
        ...FLOW_STYLES,
      ]}
      {...props}
    />
  );
});
