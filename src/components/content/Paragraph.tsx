import { forwardRef } from 'react';

import {
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  TEXT_STYLES,
} from '../../tasty';

import { CubeTextProps, Text } from './Text';

const DEFAULT_STYLES: Styles = {
  preset: 'p3',
  color: '#dark-02',
  display: 'block',
};

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export interface CubeParagraphProps
  extends CubeTextProps,
    ContainerStyleProps {}

export const Paragraph = forwardRef<HTMLElement, CubeParagraphProps>(
  function Paragraph(props, ref) {
    const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

    return <Text as="p" qa="Paragraph" {...props} ref={ref} styles={styles} />;
  },
);
