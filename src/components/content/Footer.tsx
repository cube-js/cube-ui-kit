import { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../tasty/styles/list';
import { extractStyles } from '../../tasty/utils/styles';
import { filterBaseProps } from '../../tasty/utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import {
  BaseProps,
  ContainerStyleProps,
  TextStyleProps,
} from '../../tasty/types';
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
