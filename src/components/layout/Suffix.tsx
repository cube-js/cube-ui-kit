import { CONTAINER_STYLES, ContainerStyleProps, tasty } from '@tenphi/tasty';
import { CSSProperties, forwardRef, useEffect } from 'react';

import { filterComponentBaseProps } from '../../utils/react/componentBaseProps';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
import { extractStyles } from '../../utils/styles';

import type { ComponentBaseProps } from '../../utils/react/componentBaseProps';

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

export interface CubeSuffixProps
  extends ComponentBaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Suffix = forwardRef<HTMLDivElement, CubeSuffixProps>(
  function Suffix(allProps, outerRef) {
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
        {...filterComponentBaseProps(props, { eventProps: true })}
        ref={ref}
        styles={styles}
        tokens={{ '$suffix-gap': outerGap, ...props.tokens }}
      >
        {children}
      </SuffixElement>
    );
  },
);
