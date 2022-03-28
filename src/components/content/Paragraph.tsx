import { forwardRef } from 'react';
import { CubeTextProps, Text } from './Text';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { ContainerStyleProps } from '../types';
import { Styles } from '../../styles/types';

const DEFAULT_STYLES: Styles = {
  preset: 'p3',
  color: '#dark.75',
  display: 'block',
};

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export interface CubeParagraphProps
  extends CubeTextProps,
    ContainerStyleProps {}

export const Paragraph = forwardRef<HTMLDivElement, CubeParagraphProps>(
  (props, ref) => {
    const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

    return <Text as="p" qa="Paragraph" {...props} styles={styles} ref={ref} />;
  },
);
