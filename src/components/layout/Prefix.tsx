import { CONTAINER_STYLES, ContainerStyleProps, tasty } from '@tenphi/tasty';
import { CSSProperties, forwardRef } from 'react';

import { filterComponentBaseProps } from '../../utils/react/componentBaseProps';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
import { useLayoutEffect } from '../../utils/react/useLayoutEffect';
import { extractStyles } from '../../utils/styles';

import type { ComponentBaseProps } from '../../utils/react/componentBaseProps';

const PrefixElement = tasty({
  element: 'Prefix',
  styles: {
    position: 'absolute',
    display: 'grid',
    placeContent: 'stretch',
    placeItems: 'center',
    flow: 'column',
    gap: 0,
    left: '$prefix-gap',
    top: '$prefix-gap',
    bottom: '$prefix-gap',
    color: '#dark-02',
    height: '(100% - (2 * $prefix-gap))',
  },
});

export interface CubePrefixProps
  extends ComponentBaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Prefix = forwardRef<HTMLDivElement, CubePrefixProps>(
  function Prefix(allProps, outerRef) {
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
        {...filterComponentBaseProps(props, { eventProps: true })}
        ref={ref}
        styles={styles}
        tokens={{ '$prefix-gap': outerGap, ...props.tokens }}
      >
        {children}
      </PrefixElement>
    );
  },
);
