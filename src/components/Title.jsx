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
import { useSlotProps } from '../utils/react';

const DEFAULT_STYLES = {
  area: 'heading',
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

export const Title = forwardRef(({ qa, as, level, ...props }, ref) => {
  props = useSlotProps(props, 'heading');

  const tag = `h${level || 1}`;
  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    size: tag,
    fontWeight:
      (level || 1) === 1 && (!props.size || props.size === 'h1') ? 700 : 600,
  });

  return (
    <Text
      qa={qa || 'Title'}
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
