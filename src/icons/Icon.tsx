import {
  cloneElement,
  ForwardedRef,
  forwardRef,
  memo,
  ReactElement,
} from 'react';

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
      width: 'min 1em',
      height: '1em 1em',
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
  children?: ReactElement;
}

export const Icon = memo(
  forwardRef(function Icon(
    props: CubeIconProps,
    ref: ForwardedRef<HTMLSpanElement>,
  ) {
    const { size, stroke, ...rest } = props;

    const icon = rest.children
      ? cloneElement(rest.children, {
          size: typeof size === 'number' ? size : undefined,
          stroke,
        })
      : rest.children;

    return (
      <IconElement
        ref={ref}
        qa="Icon"
        {...rest}
        styles={{ fontSize: size, ...rest.styles }}
      >
        {icon}
      </IconElement>
    );
  }),
);
