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

const HeaderElement = tasty({
  qa: 'Header',
  as: 'header',
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
    <HeaderElement
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
