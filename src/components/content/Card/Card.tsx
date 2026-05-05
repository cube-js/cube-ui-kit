import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { extractStyles } from '../../../utils/styles';

const CardElement = tasty({
  role: 'region',
  styles: {
    display: 'block',
    flow: 'column',
    radius: '(1cr + 1bw)',
    fill: '#surface',
    border: '#border',
    padding: '1.5x',
    preset: 't3',
  },
  styleProps: CONTAINER_STYLES,
});

export interface CubeCardProps
  extends Omit<AllBaseProps, 'title' | 'value' | 'placeholder' | 'text'>,
    ContainerStyleProps {}

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
