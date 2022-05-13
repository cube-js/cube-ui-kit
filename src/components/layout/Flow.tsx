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
  display: 'block',
  flow: 'column',
};

const STYLE_PROPS = CONTAINER_STYLES;

export interface CubeFlowProps extends BaseProps, ContainerStyleProps {}

export const Flow = forwardRef((props: CubeFlowProps, ref) => {
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
