import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { brandTastyComponent } from '../_internal/utils/brand-tasty-component';
import { extractStyles } from '../utils/styles';

const BlockElement = tasty({
  styles: {
    display: 'block',
  },
});

export interface CubeBlockProps
  extends Omit<AllBaseProps, keyof ContainerStyleProps | 'as'>,
    ContainerStyleProps {}

export const Block = forwardRef(function Block(props: CubeBlockProps, ref) {
  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <BlockElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});

brandTastyComponent(Block);
