import { forwardRef } from 'react';
import { CubeTextProps, TEXT_PROP_MAP } from './Text';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  PositionStyleProps,
  TagNameProps,
  tasty,
  TEXT_STYLES,
} from '../../tasty';
import { useSlotProps } from '../../utils/react';

const STYLE_LIST = [...TEXT_STYLES, ...CONTAINER_STYLES];

export interface CubeTitleProps
  extends BaseProps,
    CubeTextProps,
    TagNameProps,
    ContainerStyleProps,
    PositionStyleProps {
  /** The level of the heading **/
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const RawTitle = tasty({
  qa: 'Title',
  as: 'h1', // it should be dynamic
  styles: {
    gridArea: 'heading',
    display: 'block',
    color: '#dark',
    preset: {
      '': 'h6m',
      '[data-level="1"]': 'h1',
      '[data-level="2"]': 'h2',
      '[data-level="3"]': 'h3',
      '[data-level="4"]': 'h4',
      '[data-level="5"]': 'h5',
      '[data-level="6"]': 'h6',
    },
    margin: '0',
    whiteSpace: {
      '': 'initial',
      'nowrap | ellipsis': 'nowrap',
    },
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: 'max 100%',
  },
});

const _Title = forwardRef(
  (
    {
      qa,
      as,
      styleName,
      inline,
      nowrap,
      ellipsis,
      level,
      ...props
    }: CubeTitleProps,
    ref,
  ) => {
    props = useSlotProps(props, 'heading');

    const tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = `h${level || 1}`;
    const styles = extractStyles(props, STYLE_LIST, {}, TEXT_PROP_MAP);

    return (
      <RawTitle
        qa={qa || 'Title'}
        as={as || tag}
        styleName={styleName}
        data-level={level || 1}
        mods={{
          nowrap,
          ellipsis,
        }}
        inline={inline}
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
