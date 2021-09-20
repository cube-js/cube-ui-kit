import { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { Base } from '../Base';
import { useSlotProps } from '../../utils/react';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../types';

const DEFAULT_STYLES = {
  gridArea: 'header',
  display: 'block',
  flow: 'column',
};

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

export interface CubeHeaderProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Header = forwardRef((allProps: CubeHeaderProps, ref) => {
  const props = useSlotProps(allProps, 'header');
  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      data-id="Header"
      as="header"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
