import { forwardRef } from 'react';
import { CONTAINER_STYLES } from '../tasty/styles/list';
import { extractStyles } from '../tasty/utils/styles';
import { filterBaseProps } from '../tasty/utils/filterBaseProps';
import { AllBaseProps, ContainerStyleProps } from '../tasty/types';
import { tasty } from '../tasty';

const RawBlock = tasty({
  styled: {
    display: 'block',
  },
});

export interface CubeBlockProps
  extends Omit<AllBaseProps, keyof ContainerStyleProps | 'as'>,
    ContainerStyleProps {}

export const Block = forwardRef((props: CubeBlockProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <RawBlock
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
