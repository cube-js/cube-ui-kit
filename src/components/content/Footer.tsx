import { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { Base } from '../Base';
import { useSlotProps } from '../../utils/react';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../types';

const DEFAULT_STYLES = {
  gridArea: 'footer',
  display: 'block',
  flow: 'column',
};

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

export interface CubeFooterProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Footer = forwardRef((props: CubeFooterProps, ref) => {
  props = useSlotProps(props, 'footer');

  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      data-id="Footer"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
