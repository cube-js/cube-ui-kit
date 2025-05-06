import { forwardRef } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';

const CardElement = tasty({
  role: 'region',
  styles: {
    display: 'block',
    flow: 'column',
    radius: '(1cr + 1bw)',
    fill: '#white',
    border: true,
    padding: '1.5x',
    preset: 't3',
  },
  styleProps: CONTAINER_STYLES,
});

export interface CubeCardProps extends BaseProps, ContainerStyleProps {}

export const Card = forwardRef(function Card(props: CubeCardProps, ref) {
  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <CardElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});
