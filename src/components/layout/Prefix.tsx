import { CSSProperties, forwardRef, useEffect } from 'react';
import { Base } from '../Base';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  parseStyle,
  Styles,
} from '../../tasty';
import { useCombinedRefs } from '../../utils/react';

const DEFAULT_STYLES: Styles = {
  position: 'absolute',
  display: 'grid',
  placeContent: 'stretch',
  placeItems: 'center',
  flow: 'column',
  gap: 0,
  left: '@prefix-gap',
  top: '@prefix-gap',
  bottom: '@prefix-gap',
  color: '#dark.75',
  height: '(100% - (2 * @prefix-gap))',
};

export interface CubePrefixProps extends BaseProps, ContainerStyleProps {
  onWidthChange?: Function;
  outerGap?: CSSProperties['gap'];
}

export const Prefix = forwardRef((allProps: CubePrefixProps, outerRef) => {
  let { onWidthChange, outerGap = '1bw', children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);
  const ref = useCombinedRefs(outerRef);

  useEffect(() => {
    if (ref?.current && onWidthChange) {
      onWidthChange(ref.current.offsetWidth);
    }
  }, [children, ref, onWidthChange]);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
      style={{
        // @ts-ignore
        '--prefix-gap': parseStyle(outerGap).value,
      }}
    >
      {children}
    </Base>
  );
});
