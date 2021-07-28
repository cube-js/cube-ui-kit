import { forwardRef } from 'react';
import { Text, TextProps } from './Text';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useSlotProps } from '../utils/react/index';
import { NuStyleValue } from '../styles/types';

const DEFAULT_STYLES = {
  area: 'heading',
  display: 'block',
  color: '#dark',
};

const STYLE_LIST = [
  ...BASE_STYLES,
  ...TEXT_STYLES,
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...POSITION_STYLES,
];

export interface TitleProps extends TextProps {
  /** The level of the heading **/
  level: number,
  /** The size style for the heading **/
  size: NuStyleValue,
}

function getFontWeight(level, size) {
  return (level || 1) === 1 && (!size || size === 'h1') ? 700 : 600;
}

const _Title = forwardRef(({qa, as, level, ...props}: TitleProps, ref) => {
  props = useSlotProps(props, 'heading');

  let cachedSize;
  const tag = `h${level || 1}`;
  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    size: tag,
    fontWeight:
      Array.isArray(props.size) ? props.size.map(size => {
        if (size == null) size = cachedSize;

        cachedSize = size;

        return getFontWeight(level, size);
      }) : getFontWeight(level, props.size),
  });

  return (
    <Text
      qa={qa || 'Title'}
      as={as || tag}
      {...filterBaseProps(props, {eventProps: true})}
      styles={styles}
      ref={ref}
    />
  );
});

const Title = Object.assign(
  _Title,
  {
    Danger: function DangerTitle(props) {
      return <Title color="#danger-text" {...props} />;
    },
    Success: function SuccessTitle(props) {
      return <Title color="#success-text" {...props} />;
    },
  },
);

export { Title };
