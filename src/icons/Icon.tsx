import { ForwardedRef, forwardRef, memo, ReactElement } from 'react';

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
    fontSize: '$icon-size',
    transition: 'theme, width, height',
    textAlign: 'center',
    textTransform: 'none',
    textRendering: 'optimizeLegibility',
    '-webkit-font-smoothing': 'antialiased',

    '& svg': {
      transition: 'all',
    },

    '& svg.tabler-icon': {
      width: 'min 1em',
      height: '1em 1em',
      strokeWidth: '@stroke-width',
    },

    '& svg:not(.tabler-icon)': {
      width: 'min (1em - 2px)',
      height: '(1em - 2px) (1em - 2px)',
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
  title?: string;
}

export const Icon = memo(
  forwardRef(function Icon(
    props: CubeIconProps,
    ref: ForwardedRef<HTMLSpanElement>,
  ) {
    let { size, styles, stroke, ...rest } = props;

    if (size) {
      styles = {
        ...styles,
        fontSize: size,
      };
    }
    if (stroke) {
      styles = {
        ...styles,
        '$stroke-width': stroke,
      };
    }

    return <IconElement ref={ref} qa="Icon" {...rest} styles={styles} />;
  }),
);
