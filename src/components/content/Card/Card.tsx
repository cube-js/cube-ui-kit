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
    // Only on request: `inline-size` ignores the content's width, so a Card
    // sized by its content would shrink to its padding.
    container: { '': false, 'query-container': 'card / inline-size' },
  },
  styleProps: CONTAINER_STYLES,
});

export interface CubeCardProps
  extends
    Omit<AllBaseProps, 'title' | 'value' | 'placeholder' | 'text'>,
    ContainerStyleProps {
  /**
   * Makes the card the `card` query container (`container: card / inline-size`),
   * so its content can respond to its width: `@(card, w < 400px)`, or
   * `collapseState` on a `Button`. Set it only on a card whose width comes from
   * outside, such as a block, a stretched item or a set `width`: a container
   * ignores its content's width, so a card sized by its content shrinks to its
   * padding.
   */
  isQueryContainer?: boolean;
}

export const Card = forwardRef(function Card(props: CubeCardProps, ref) {
  const { isQueryContainer, mods, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <CardElement
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={ref}
      mods={{ 'query-container': !!isQueryContainer, ...mods }}
      styles={styles}
    />
  );
});
