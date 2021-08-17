import { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { AllBaseProps, ContainerStyleProps } from './types';

const DEFAULT_STYLES = {
  display: 'block',
};

export interface CubeBlockProps extends Omit<AllBaseProps, keyof ContainerStyleProps | 'as'>, ContainerStyleProps {}

export const Block = forwardRef((props: CubeBlockProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
