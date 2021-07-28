import React, { forwardRef } from 'react';
import { Text } from './Text';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  DIMENSION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';

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
  ...DIMENSION_STYLES,
];

export const Paragraph = forwardRef((props, ref) => {
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return (
    <Text
      as="p"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
