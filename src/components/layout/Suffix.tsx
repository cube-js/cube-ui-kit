import { CSSProperties, forwardRef, useEffect } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  parseStyle,
  tasty,
} from '../../tasty';
import { useCombinedRefs } from '../../utils/react';

const SuffixElement = tasty({
  element: 'Suffix',
  styles: {
    position: 'absolute',
    display: 'grid',
    placeContent: 'stretch',
    placeItems: 'center',
    flow: 'column',
    gap: 0,
    right: '$suffix-gap',
    top: '$suffix-gap',
    bottom: '$suffix-gap',
    color: '#dark-02',
    height: '(100% - (2 * $suffix-gap))',
  },
});

export interface CubeSuffixProps extends BaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Suffix = forwardRef(function Suffix(
  allProps: CubeSuffixProps,
  outerRef,
) {
  let { onWidthChange, outerGap = '1bw', children, ...props } = allProps;
  const styles = extractStyles(props, CONTAINER_STYLES);
  const ref = useCombinedRefs(outerRef);

  useEffect(() => {
    if (ref && ref.current && onWidthChange) {
      onWidthChange(ref.current.offsetWidth);
    }
  }, [children, ref, onWidthChange]);

  return (
    <SuffixElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
      style={{
        '--suffix-gap': parseStyle(outerGap).output,
      }}
    >
      {children}
    </SuffixElement>
  );
});
