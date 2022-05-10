import { forwardRef } from 'react';
import { tasty } from '../../tasty';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../tasty/styles/list';
import { extractStyles } from '../../tasty/utils/styles';
import { filterBaseProps } from '../../tasty/utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import {
  BaseProps,
  ContainerStyleProps,
  TextStyleProps,
} from '../../tasty/types';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

const RawHeader = tasty({
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
    <RawHeader
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
