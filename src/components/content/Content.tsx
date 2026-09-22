import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
  TEXT_STYLES,
  TextStyleProps,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useSlotProps } from '../../utils/react';
import { extractStyles } from '../../utils/styles';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

const ContentElement = tasty({
  qa: 'Content',
  // Stable where `qa` is not: `Dialog` finds its body by this to watch it for
  // overflow, and a consumer's own `qa` must not hide it.
  'data-id': 'Content',
  as: 'section',
  styles: {
    gridArea: 'content',
    preset: 'p3',
    color: '#dark-02',
    display: 'block',
    flow: 'column',
    gap: '2x',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});

export interface CubeContentProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Content = forwardRef(function Content(
  props: CubeContentProps,
  ref,
) {
  props = useSlotProps(props, 'content');

  const styles = extractStyles(props, STYLE_LIST);

  return (
    <ContentElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});
