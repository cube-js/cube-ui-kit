import { forwardRef } from 'react';
import { Text } from './Text';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import {
  BaseProps,
  BaseStyleProps,
  BlockStyleProps,
  ColorStyleProps,
  DimensionStyleProps,
  PositionStyleProps,
  TextStyleProps,
} from './types';
import { NuStyles } from '../styles/types';

const DEFAULT_STYLES: NuStyles = {
  size: 'text',
  color: '#dark.75',
  display: 'block',
};

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...TEXT_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
  ...DIMENSION_STYLES,
];

export interface CubeParagraphProps
  extends BaseProps,
    BaseStyleProps,
    TextStyleProps,
    BlockStyleProps,
    ColorStyleProps,
    PositionStyleProps,
    DimensionStyleProps {}

export const Paragraph = forwardRef((props: CubeParagraphProps, ref) => {
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  return (
    <Text
      as="p"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
