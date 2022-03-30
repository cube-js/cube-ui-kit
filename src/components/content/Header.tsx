import { forwardRef } from 'react';
import { styled } from '../../styled';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../types';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

const RawHeader = styled({
  name: 'Header',
  tag: 'header',
  props: { 'data-id': 'Header' },
  styles: {
    display: 'block',
    gridArea: 'header',
    flow: 'column',
  },
});

export interface CubeHeaderProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Header = forwardRef((props: CubeHeaderProps, ref) => {
  props = useSlotProps(props, 'header');

  const styles = extractStyles(props, STYLE_LIST);

  return (
    <RawHeader
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
