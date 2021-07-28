import React, { forwardRef } from 'react';
import { Base } from '../../components/Base';
import THEMES from '../../data/themes';
import {
  BLOCK_STYLES,
  DIMENSION_STYLES,
  COLOR_STYLES,
  FLOW_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  padding: '1.5x',
};

const STYLE_LIST = [
  ...FLOW_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
];

export const Alert = forwardRef(({ type, label, ...props }, ref) => {
  type = type || 'note';
  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    fill: THEMES[type] ? THEMES[type].fill : '#clear',
    border:
      THEMES[type] && THEMES[type].border ? THEMES[type].border : '#clear',
    color: '#dark',
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
