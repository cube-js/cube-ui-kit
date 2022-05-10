import { forwardRef } from 'react';
import { Base } from '../../Base';
import { CONTAINER_STYLES } from '../../../tasty/styles/list';
import { extractStyles } from '../../../tasty/utils/styles';
import { filterBaseProps } from '../../../tasty/utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../../tasty/types';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1r',
  fill: '#white',
  border: true,
  padding: '1.5x',
  preset: 't3',
};

export interface CubeCardProps extends BaseProps, ContainerStyleProps {}

export const Card = forwardRef((props: CubeCardProps, ref) => {
  const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
