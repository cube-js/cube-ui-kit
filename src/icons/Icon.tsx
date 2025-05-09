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
    fontSize: {
      // legacy icons
      '': 'calc(var(--icon-size, calc(var(--font-size) + 4px)) - 2px)',
      // tabler icons
      ':has(.tabler-icon)': 'var(--icon-size, var(--font-size))',
    },
    transition: 'theme, width, height',
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
    let { size, styles, stroke, ...rest } = props;

    const icon = rest.children
      ? cloneElement(rest.children, {
          size: typeof size === 'number' ? size : undefined,
          stroke,
        })
      : rest.children;

    if (size) {
      styles = {
        ...styles,
        fontSize: size,
      };
    }
    if (stroke) {
      styles = {
        ...styles,
        '@stroke-width': stroke,
      };
    }

    return (
      <IconElement ref={ref} qa="Icon" {...rest} styles={styles}>
        {icon}
      </IconElement>
    );
  }),
);
