import { forwardRef } from 'react';
import { styled } from '../../styled';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../types';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

const RawContent = styled({
  name: 'Content',
  tag: 'section',
  styles: {
    gridArea: 'content',
    preset: 'p3',
    color: '#dark.75',
    display: 'block',
    flow: 'column',
    gap: '2x',
  },
  attrs: {
    'data-id': 'Content',
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
