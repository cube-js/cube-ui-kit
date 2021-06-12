import React, { forwardRef } from 'react';
import { Base } from './Base';
import { OUTER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'block',
  height: '1bw',
  fill: '#border',
  width: '100%',
};

export const Divider = forwardRef((props, ref) => {
  const styles = extractStyles(props, OUTER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
