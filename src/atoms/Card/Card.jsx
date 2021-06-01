import React, { forwardRef } from 'react';
import { Base } from '../../components/Base';
import {
  BLOCK_STYLES,
  DIMENSION_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  FLOW_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles.js';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  fill: '#white',
  border: true,
  padding: '3x',
};

const STYLE_LIST = [
  'display',
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
  ...FLOW_STYLES,
];

export const Card = forwardRef(({ ...props }, ref) => {
  const { styles, otherProps } = extractStyles(
    props,
    STYLE_LIST,
    DEFAULT_STYLES,
  );

  return <Base role="region" {...otherProps} styles={styles} ref={ref} />;
});
