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
    overflow: 'auto',
    styledScrollbar: true,
  },
  'data-id': 'Content',
});

export interface CubeContentProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {}

export const Content = forwardRef<HTMLDivElement, CubeContentProps>(
  (props, ref) => {
    const slottedProps = useSlotProps(props, 'content');
    const styles = extractStyles(slottedProps, STYLE_LIST);

    return (
      <RawContent
        ref={ref}
        {...filterBaseProps(slottedProps, { eventProps: true })}
        styles={styles}
      />
    );
  },
);
