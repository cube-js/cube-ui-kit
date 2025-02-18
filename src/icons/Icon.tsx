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

const IconElement = tasty({
  as: 'span',
  styles: {
    display: 'inline-grid',
    placeContent: 'center',
    verticalAlign: 'sub',
    width: '1em 1em',
    height: 'min 1em',
    fontSize: 'var(--icon-size, var(--font-size))',
    textAlign: 'center',
    textTransform: 'none',
    textRendering: 'optimizeLegibility',
    '-webkit-font-smoothing': 'antialiased',

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

export const Icon = memo(function Icon(props: CubeIconProps) {
  const { size, styles, ...rest } = props;

  return (
    <IconElement
      qa="Icon"
      {...rest}
      styles={size ? { fontSize: size, ...styles } : styles}
    />
  );
});
