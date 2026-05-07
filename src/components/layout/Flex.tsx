import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { brandTastyComponent } from '../../_internal/utils/brand-tasty-component';
import { extractStyles } from '../../utils/styles';

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

brandTastyComponent(Flex);
