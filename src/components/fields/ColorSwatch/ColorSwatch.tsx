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
import { ColorValue, parseColor, toHex } from '../color/color';

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

    /**
     * The control the swatch sits in, when there is one.
     *
     * `Item`, `Button` and `TextInputBase` all publish their own height as
     * `$size`, and a custom property reaches any descendant — so a swatch in an
     * icon, prefix or suffix slot reads the host's height without either side
     * knowing about the other. `$swatch-host` is the fallback chain: an explicit
     * `size` pins it, and outside a control the medium default stands in.
     *
     * The named sizes are stated as the *host* they would fit, not as the swatch
     * itself, so the `- 1x` below is the single place the inset is expressed.
     */
    '$swatch-host': {
      // `var(--size, 4x)` — a host wins, and 32px is a medium control.
      '': '($size, 4x)',
      // An explicit size ignores the host: these are 28/32/36, one `1x` above
      // the 20/24/28 the swatch ends up at.
      'size=small': '3.5x',
      'size=medium': '4x',
      'size=large': '4.5x',
    },
    '$swatch-size': '($swatch-host - 1x)',

    width: '$swatch-size $swatch-size',
    height: '$swatch-size $swatch-size',
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
  /**
   * The edge of the swatch: 20px, 24px or 28px. Left unset, the swatch tracks
   * the control around it — `1x` inside its height — and falls back to `medium`
   * where there is no control.
   */
  size?: 'small' | 'medium' | 'large' | (string & {});
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
  const { color, mods, qa, size } = props;
  const styles = extractStyles(props, STYLE_PROPS);

  const resolved =
    typeof color === 'string' ? parseColor(color) : color ?? null;

  return (
    <SwatchElement
      ref={ref}
      qa={qa}
      data-size={size}
      mods={{ empty: !resolved, ...mods }}
      styles={styles}
      style={resolved ? { '--color-picker-color': toHex(resolved) } : undefined}
    />
  );
});
