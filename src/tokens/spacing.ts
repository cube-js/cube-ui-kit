import type { Styles } from '../tasty/styles/types';

/**
 * Spacing tokens using tasty multiplier syntax.
 * Values like `.5x` mean 0.5 × gap, `2x` means 2 × gap.
 *
 * Keys use $ prefix for CSS custom properties.
 */
export const SPACE_TOKENS: Styles = {
  '$space-xs': '.5x',
  '$space-sm': '.75x',
  '$space-md': '1x',
  '$space-lg': '1.5x',
  '$space-xl': '2x',
};
