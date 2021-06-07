import React, { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'block',
};
export const Block = forwardRef((props, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
