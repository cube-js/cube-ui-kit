import { forwardRef } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
  TEXT_STYLES,
  TextStyleProps,
} from '../../tasty';
import { useSlotProps } from '../../utils/react';

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
