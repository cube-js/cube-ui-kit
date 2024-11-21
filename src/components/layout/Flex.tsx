import { forwardRef } from 'react';

import {
  AllBaseProps,
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

export interface CubeFlexProps extends AllBaseProps, ContainerStyleProps {}

export const Flex = forwardRef(function Flex(props: CubeFlexProps, ref) {
  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <FlexElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});
