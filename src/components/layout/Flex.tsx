import { forwardRef } from 'react';
import { Base } from '../Base';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
} from '../../tasty';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
};

export interface CubeFlexProps extends BaseProps, ContainerStyleProps {}

export const Flex = forwardRef((props: CubeFlexProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
