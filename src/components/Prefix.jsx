import React, { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'grid',
  content: 'center',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
};

export const Prefix = forwardRef((props, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
