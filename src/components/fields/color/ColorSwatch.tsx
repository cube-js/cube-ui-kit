import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  BLOCK_STYLES,
  BlockStyleProps,
  DIMENSION_STYLES,
  DimensionStyleProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { ForwardedRef, forwardRef } from 'react';

import { extractStyles } from '../../../utils/styles';

import { ColorValue, parseColor, toHex } from './color';

const STYLE_PROPS = [
  ...BASE_STYLES,
  ...OUTER_STYLES,
  ...BLOCK_STYLES,
  ...DIMENSION_STYLES,
];

const SwatchElement = tasty({
  qa: 'ColorSwatch',
  styles: {
    display: 'block',
    width: '2.5x',
    height: '2.5x',
    radius: '1r',
    fill: {
      '': '(#color-picker, #clear)',
      empty: '#clear',
    },
    shadow: 'inset 0 0 0 1bw #dark.15',
    // A single diagonal stroke is the conventional "no color" swatch.
    image: {
      '': false,
      empty:
        'linear-gradient(to bottom right, #clear 46%, #danger 46%, #danger 54%, #clear 54%)',
    },
  },
});

export interface CubeColorSwatchProps
  extends BaseProps,
    BaseStyleProps,
    OuterStyleProps,
    BlockStyleProps,
    DimensionStyleProps {
  /** The color to show. Anything the color inputs accept; `null` shows the empty state. */
  color?: string | ColorValue | null;
  styles?: Styles;
}

/**
 * A square of color. Decorative on its own — pair it with the value as text, or
 * with a control that names it.
 *
 * The color travels as an inline custom property rather than through `styles`,
 * so the swatch keeps a single cached style rule however often it changes.
 */
export const ColorSwatch = forwardRef(function ColorSwatch(
  props: CubeColorSwatchProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { color, mods, qa } = props;
  const styles = extractStyles(props, STYLE_PROPS);

  const resolved =
    typeof color === 'string' ? parseColor(color) : color ?? null;

  return (
    <SwatchElement
      ref={ref}
      qa={qa}
      mods={{ empty: !resolved, ...mods }}
      styles={styles}
      style={resolved ? { '--color-picker-color': toHex(resolved) } : undefined}
    />
  );
});
