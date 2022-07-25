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
    right: '@suffix-gap',
    top: '@suffix-gap',
    bottom: '@suffix-gap',
    color: '#dark.75',
    height: '(100% - (2 * @suffix-gap))',
  },
});

export interface CubeSuffixProps extends BaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Suffix = forwardRef((allProps: CubeSuffixProps, outerRef) => {
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
      styles={styles}
      ref={ref}
      style={{
        '--suffix-gap': parseStyle(outerGap).value,
      }}
    >
      {children}
    </SuffixElement>
  );
});
