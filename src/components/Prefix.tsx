import { forwardRef, useEffect } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles, parseStyle } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useCombinedRefs } from '../utils/react/useCombinedRefs';

const DEFAULT_STYLES = {
  display: 'grid',
  position: 'absolute',
  items: 'center',
  gap: 0,
  left: '@prefix-gap',
  top: '@prefix-gap',
  bottom: '@prefix-gap',
  color: '#dark.75',
  height: '(100% - (2 * @prefix-gap))',
};

export const Prefix = forwardRef(
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
        style={{ '--prefix-gap': parseStyle(outerGap).value }}
      >
        {children}
      </Base>
    );
  },
);
