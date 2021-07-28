import React, { forwardRef, useEffect } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles, parseStyle } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useCombinedRefs } from '../utils/react/useCombinedRefs';

const DEFAULT_STYLES = {
  display: 'grid',
  content: 'stretch',
  items: 'center',
  flow: 'column',
  gap: 0,
  position: 'absolute',
  right: '@suffix-gap',
  top: '@suffix-gap',
  bottom: '@suffix-gap',
  color: '#dark.75',
  height: '(100% - (2 * @suffix-gap))',
};

export const Suffix = forwardRef(
  ({ onWidthChange, outerGap = '1bw', children, ...props }, ref) => {
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
        style={{ '--suffix-gap': parseStyle(outerGap).value }}
      >
        {children}
      </Base>
    );
  },
);
