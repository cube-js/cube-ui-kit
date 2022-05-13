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
  gap: true,
};

export interface CubeSpaceProps extends BaseProps, ContainerStyleProps {
  direction?: 'vertical' | 'horizontal';
}

export const Space = forwardRef(function Space(props: CubeSpaceProps, ref) {
  const flow = props.direction
    ? props.direction === 'vertical'
      ? 'column'
      : 'row'
    : props.flow || 'row';
  const styles = extractStyles(props, CONTAINER_STYLES, {
    ...DEFAULT_STYLES,
    flow,
    alignItems: flow === 'row' ? 'center' : 'stretch',
  });

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
