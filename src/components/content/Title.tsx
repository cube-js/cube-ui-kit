import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  PositionStyleProps,
  tasty,
  TEXT_STYLES,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useSlotProps } from '../../utils/react';
import { extractStyles } from '../../utils/styles';

import { CubeTextProps, TEXT_PROP_MAP } from './Text';

const STYLE_LIST = [...TEXT_STYLES, ...CONTAINER_STYLES];

export interface CubeTitleProps
  extends BaseProps, CubeTextProps, ContainerStyleProps, PositionStyleProps {
  /** The level of the heading **/
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** The slot to read provided props from. Defaults to `title` */
  slot?: string;
}

const TitleElement = tasty({
  qa: 'Title',
  as: 'h1', // it should be dynamic
  styles: {
    gridArea: 'title',
    display: 'block',
    color: '#dark',
    preset: {
      '': 'h6',
      'level=1': 'h1',
      'level=2': 'h2',
      'level=3': 'h3',
      'level=4': 'h4',
      'level=5': 'h5',
      'level=6': 'h6',
    },
    margin: '0',
    whiteSpace: {
      '': 'inherit',
      'nowrap | ellipsis': 'nowrap',
    },
    textOverflow: {
      '': false,
      ellipsis: 'ellipsis',
    },
    overflow: {
      '': false,
      ellipsis: 'hidden',
    },
    width: {
      '': false,
      ellipsis: 'max 100%',
    },
  },
});

const Title = forwardRef(function CubeTitle(
  { qa, as, nowrap, ellipsis, ...props }: CubeTitleProps,
  ref,
) {
  // `level` is read after the slot merge: `Dialog` makes its title an `h2`
  // through the slot, and a level taken from the bare props never sees that.
  const { level, ...propsWithSlots } = useSlotProps(props, 'title');

  const headingLevel: NonNullable<CubeTitleProps['level']> = level || 1;
  const tag = `h${headingLevel}` as const;
  const styles = extractStyles(propsWithSlots, STYLE_LIST, {}, TEXT_PROP_MAP);

  return (
    <TitleElement
      qa={qa || 'Title'}
      as={as || tag}
      data-level={headingLevel}
      mods={{
        nowrap,
        ellipsis,
      }}
      {...filterBaseProps(propsWithSlots, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});

const _Title = Object.assign(Title, {
  Danger: forwardRef(function DangerTitle(props: CubeTitleProps, ref) {
    return <Title ref={ref} color="#danger-text" {...props} />;
  }),
  Success: forwardRef(function SuccessTitle(props: CubeTitleProps, ref) {
    return <Title ref={ref} color="#success-text" {...props} />;
  }),
});

_Title.displayName = 'Title';

export { _Title as Title };
