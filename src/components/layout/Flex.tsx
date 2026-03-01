import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

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
