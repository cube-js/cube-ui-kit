import { ForwardedRef, forwardRef, memo } from 'react';

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
import { mergeProps } from '../utils/react/index';

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
      strokeWidth: '@stroke-width',
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
  stroke?: number;
}

export const Icon = memo(
  forwardRef(function Icon(
    props: CubeIconProps,
    ref: ForwardedRef<HTMLSpanElement>,
  ) {
    const { size, styles, stroke, ...rest } = props;

    const mergedProps =
      size != null && stroke != null
        ? mergeProps(rest, {
            ...(size ? { fontSize: size } : {}),
            ...(stroke ? { '@stroke-width': stroke } : {}),
          })
        : rest;

    return <IconElement ref={ref} qa="Icon" {...mergedProps} />;
  }),
);
