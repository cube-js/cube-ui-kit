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
import { filterBaseProps } from '../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'block',
  color: '#dark',
};

const STYLE_LIST = [
  ...BASE_STYLES,
  ...TEXT_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
];

export const Title = forwardRef(({ as, level, ...props }, ref) => {
  const tag = `h${level || 1}`;
  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    size: tag,
    fontWeight: (level || 1) === 1 ? 700 : 600,
  });

  return (
    <Text
      as={as || tag}
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});

Title.Danger = function DangerTitle(props) {
  return <Title color="#danger-text" {...props} />;
};

Title.Success = function SuccessTitle(props) {
  return <Title color="#success-text" {...props} />;
};
