import { Styles, tasty } from '@tenphi/tasty';

import { ColorValue, toHex } from './color';

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

export interface ColorSwatchProps {
  /** The color to show, or `null` for the empty state. */
  color: ColorValue | null;
  styles?: Styles;
}

/**
 * The square of color both controls put in front of their value. Decorative:
 * the color is always available as text next to it.
 *
 * The color travels as an inline custom property so the swatch keeps a single
 * cached style rule however often it changes.
 */
export function ColorSwatch({ color, styles }: ColorSwatchProps) {
  return (
    <SwatchElement
      mods={{ empty: !color }}
      styles={styles}
      style={color ? { '--color-picker-color': toHex(color) } : undefined}
    />
  );
}
