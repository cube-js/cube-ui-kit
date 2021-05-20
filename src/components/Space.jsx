import React, { forwardRef } from 'react';
import Base from './Base';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  POSITION_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles';

const DEFAULT_STYLES = {
  display: 'flex',
  gap: true,
  items: 'center stretch',
};

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
  ...DIMENSION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
];

const Space = forwardRef(function Space(props, ref) {
  const flow = props.direction ? (props.direction === 'vertical' ? 'column' : 'row') : (props.flow || 'row');
  const { styles, otherProps } = extractStyles(props, STYLE_PROPS, {
    ...DEFAULT_STYLES,
    flow,
    items: props.align ? props.align : (flow === 'row' ? 'center' : 'stretch'),
  });

  delete otherProps.align;
  delete otherProps.direction;

  return (
    <Base
      {...otherProps}
      styles={styles}
      ref={ref}
    />
  );
});

export default Space;
