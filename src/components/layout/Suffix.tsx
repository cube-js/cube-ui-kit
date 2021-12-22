import { CSSProperties, forwardRef, useEffect } from 'react';
import { Base } from '../Base';
import { CONTAINER_STYLES } from '../../styles/list';
import { extractStyles, parseStyle } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useCombinedRefs } from '../../utils/react';
import { BaseProps, ContainerStyleProps } from '../types';
import { Styles } from '../../styles/types';

const DEFAULT_STYLES: Styles = {
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
};

export interface CubeSuffixProps extends BaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Suffix = forwardRef((allProps: CubeSuffixProps, outerRef) => {
  let { onWidthChange, outerGap = '1bw', children, ...props } = allProps;
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);
  const ref = useCombinedRefs(outerRef);

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
      style={{
        '--suffix-gap': parseStyle(outerGap).value,
      }}
    >
      {children}
    </Base>
  );
});
