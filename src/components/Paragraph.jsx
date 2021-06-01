import React, { forwardRef } from 'react';
import { Text } from './Text';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles.js';

const DEFAULT_STYLES = {
  size: 'text',
  color: '#dark.75',
  display: 'block',
};

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...TEXT_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
];

export const Paragraph = forwardRef((props, ref) => {
  const { styles, otherProps } = extractStyles(
    props,
    STYLE_PROPS,
    DEFAULT_STYLES,
  );

  return <Text as="p" {...otherProps} styles={styles} ref={ref} />;
});
