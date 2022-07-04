import { forwardRef } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../tasty';

const FlexElement = tasty({
  styles: {
    display: 'flex',
    flow: 'row',
  },
});

export interface CubeFlexProps extends BaseProps, ContainerStyleProps {}

export const Flex = forwardRef((props: CubeFlexProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <FlexElement
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
