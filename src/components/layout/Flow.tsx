import { forwardRef } from 'react';
import { Base } from '../Base';
import { CONTAINER_STYLES } from '../../tasty/styles/list';
import { extractStyles } from '../../tasty/utils/styles';
import { filterBaseProps } from '../../tasty/utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../tasty/types';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
};

const STYLE_PROPS = CONTAINER_STYLES;

export interface CubeFlowProps extends BaseProps, ContainerStyleProps {}

export const Flow = forwardRef((props: CubeFlowProps, ref) => {
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
