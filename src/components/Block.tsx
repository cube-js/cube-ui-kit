import { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from './types';

const DEFAULT_STYLES = {
  display: 'block',
};

export interface BlockProps extends BaseProps, ContainerStyleProps {}

export const Block = forwardRef((props: BlockProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
