import { forwardRef } from 'react';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { AllBaseProps, ContainerStyleProps } from './types';
import { styled } from '../styled';

export const CUBE_BLOCK_STYLES = {
  display: 'block',
};

export interface CubeBlockProps
  extends Omit<AllBaseProps, keyof ContainerStyleProps | 'as'>,
    ContainerStyleProps {}

const RawBlock = styled({
  styles: CUBE_BLOCK_STYLES,
});

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
