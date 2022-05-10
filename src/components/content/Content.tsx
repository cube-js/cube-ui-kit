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

const RawContent = tasty({
  qa: 'Content',
  as: 'section',
  styles: {
    gridArea: 'content',
    preset: 'p3',
    color: '#dark.75',
    display: 'block',
    flow: 'column',
    gap: '2x',
    overflow: 'auto',
    styledScrollbar: true,
  },
});

export interface CubeContentProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Content = forwardRef((props: CubeContentProps, ref) => {
  props = useSlotProps(props, 'content');

  const styles = extractStyles(props, STYLE_LIST);

  return (
    <RawContent
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
