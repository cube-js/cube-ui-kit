import React, { forwardRef } from 'react';
import { Base } from './Base';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  POSITION_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles.js';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
};

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
];

export const Flow = forwardRef((props, ref) => {
  const { styles, otherProps } = extractStyles(
    props,
    STYLE_PROPS,
    DEFAULT_STYLES,
  );

  return <Base {...otherProps} styles={styles} ref={ref} />;
});
