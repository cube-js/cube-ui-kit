import { forwardRef } from 'react';
import { CubeTextProps, Text } from './Text';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { ContainerStyleProps } from '../types';
import { Styles } from '../../styles/types';

const DEFAULT_STYLES: Styles = {
  size: 'text',
  color: '#dark.75',
  display: 'block',
};

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export interface CubeParagraphProps
  extends CubeTextProps,
    ContainerStyleProps {}

export const Paragraph = forwardRef((props: CubeParagraphProps, ref) => {
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return <Text {...props} as="p" styles={styles} ref={ref} />;
});
