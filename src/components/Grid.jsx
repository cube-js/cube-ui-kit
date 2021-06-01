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
  display: 'grid',
  flow: 'row',
};

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
  ...DIMENSION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
];

export const Grid = forwardRef((props, ref) => {
  const { styles, otherProps } = extractStyles(
    props,
    STYLE_PROPS,
    DEFAULT_STYLES,
  );

  return <Base {...otherProps} styles={styles} ref={ref} />;
});
