import { forwardRef } from 'react';
import { Text, CubeTextProps } from './Text';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import {
  BaseProps,
  BlockStyleProps,
  PositionStyleProps,
  TagNameProps,
} from '../types';

const DEFAULT_STYLES = {
  gridArea: 'heading',
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

const PROP_MAP = {
  align: 'textAlign',
  transform: 'textTransform',
  weight: 'fontWeight',
  italic: 'fontStyle',
} as const;

export interface CubeTitleProps
  extends BaseProps,
    CubeTextProps,
    TagNameProps,
    BlockStyleProps,
    PositionStyleProps {
  /** The level of the heading **/
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const _Title = forwardRef(
  ({ qa, as, level, ...props }: CubeTitleProps, ref) => {
    props = useSlotProps(props, 'heading');

    const tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = `h${level || 1}`;
    const styles = extractStyles(
      props,
      STYLE_LIST,
      {
        ...DEFAULT_STYLES,
        preset: tag,
      },
      PROP_MAP,
    );

    return (
      <Text
        qa={qa || 'Title'}
        as={as || tag}
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
      />
    );
  },
);

const Title = Object.assign(_Title, {
  Danger: forwardRef(function DangerTitle(props: CubeTitleProps, ref) {
    return <Title ref={ref} color="#danger-text" {...props} />;
  }),
  Success: forwardRef(function SuccessTitle(props: CubeTitleProps, ref) {
    return <Title ref={ref} color="#success-text" {...props} />;
  }),
});

export { Title };
