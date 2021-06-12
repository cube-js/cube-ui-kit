import React, { forwardRef, useEffect } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useCombinedRefs } from '../utils/react/useCombinedRefs';

const DEFAULT_STYLES = {
  display: 'grid',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
};

export const Prefix = forwardRef(
  ({ onWidthChange, children, ...props }, ref) => {
    const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

    ref = useCombinedRefs(ref);

    useEffect(() => {
      if (ref && ref.current && onWidthChange) {
        onWidthChange(ref.current.offsetWidth);
      }
    }, [children, ref, onWidthChange]);

    return (
      <Base
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
      >
        {children}
      </Base>
    );
  },
);
