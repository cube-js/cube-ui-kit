import { forwardRef } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../tasty';

const FlowElement = tasty({
  styles: {
    display: 'block',
    flow: 'column',
  },
});

const STYLE_PROPS = CONTAINER_STYLES;

export interface CubeFlowProps extends BaseProps, ContainerStyleProps {}

export const Flow = forwardRef(function Flow(props: CubeFlowProps, ref) {
  const styles = extractStyles(props, STYLE_PROPS);

  return (
    <FlowElement
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
