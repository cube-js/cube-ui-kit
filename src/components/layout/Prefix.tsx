import { CSSProperties, forwardRef } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  parseStyle,
  tasty,
} from '../../tasty';
import { useCombinedRefs, useLayoutEffect } from '../../utils/react';

const PrefixElement = tasty({
  element: 'Prefix',
  styles: {
    position: 'absolute',
    display: 'grid',
    placeContent: 'stretch',
    placeItems: 'center',
    flow: 'column',
    gap: 0,
    left: '@prefix-gap',
    top: '@prefix-gap',
    bottom: '@prefix-gap',
    color: '#dark-02',
    height: '(100% - (2 * @prefix-gap))',
  },
});

export interface CubePrefixProps extends BaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Prefix = forwardRef(function Prefix(
  allProps: CubePrefixProps,
  outerRef,
) {
  let { onWidthChange, outerGap = '1bw', children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES);
  const ref = useCombinedRefs(outerRef);

  useLayoutEffect(() => {
    if (ref?.current && onWidthChange) {
      onWidthChange(ref.current.offsetWidth);
    }
  }, [children, ref, onWidthChange]);

  return (
    <PrefixElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
      style={{
        // @ts-ignore
        '--prefix-gap': parseStyle(outerGap).value,
      }}
    >
      {children}
    </PrefixElement>
  );
});
