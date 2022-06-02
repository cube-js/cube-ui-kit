import { forwardRef } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '../../../tasty';

const CardElement = tasty({
  role: 'region',
  styles: {
    display: 'block',
    flow: 'column',
    radius: '1r',
    fill: '#white',
    border: true,
    padding: '1.5x',
    preset: 't3',
  },
  styleProps: CONTAINER_STYLES,
});

export interface CubeCardProps extends BaseProps, ContainerStyleProps {}

export const Card = forwardRef((props: CubeCardProps, ref) => {
  return (
    <CardElement
      {...filterBaseProps(props, { eventProps: true })}
      styles={props.styles}
      ref={ref}
    />
  );
});
