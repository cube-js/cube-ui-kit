import { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../types';
import { tasty } from '../../tasty';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

const RawFooter = tasty({
  qa: 'Footer',
  'data-id': 'Footer',
  styles: {
    gridArea: 'footer',
    display: 'block',
    flow: 'column',
  },
});

export interface CubeFooterProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Footer = forwardRef((props: CubeFooterProps, ref) => {
  props = useSlotProps(props, 'footer');

  const styles = extractStyles(props, STYLE_LIST);

  return (
    <RawFooter
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
