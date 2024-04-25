import { memo } from 'react';

import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../tasty';

const IconContainerElement = tasty({
  as: 'span',
  styles: {
    display: 'inline-grid',
    placeContent: 'center',
    verticalAlign: 'middle',
    width: '1em 1em',
    height: 'min 1em',
    fontSize: 'var(--icon-size, var(--font-size))',

    '& svg': {
      width: '1em 1em',
      height: 'min 1em',
    },
  },
  styleProps: [...OUTER_STYLES, ...BASE_STYLES, ...COLOR_STYLES],
});

export interface CubeIconProps
  extends BaseProps,
    OuterStyleProps,
    ColorStyleProps,
    BaseStyleProps {
  size?: Styles['fontSize'];
}

export const IconContainer = memo(function IconContainer(props: CubeIconProps) {
  const { size, ...rest } = props;

  return (
    <IconContainerElement
      qa="Icon"
      {...rest}
      styles={
        size || props.styles ? { fontSize: size, ...props.styles } : undefined
      }
    />
  );
});
