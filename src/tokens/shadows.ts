import type { Styles } from '../tasty/styles/types';

/**
 * Shadow tokens using tasty shorthand syntax.
 *
 * Format: `<offset-y> <blur> <spread?> <color>`
 * - `1bw` = 1 × border-width
 * - `.5x` = 0.5 × gap
 * - `#dark.15` = dark color at 15% opacity
 *
 * Keys use $ prefix for CSS custom properties.
 */
export const SHADOW_TOKENS: Styles = {
  /** Subtle shadow for list items */
  '$item-shadow': '0 1bw .375x #dark.15',
  /** Standard card elevation */
  '$card-shadow': '0 .5x 2x #shadow',
  /** Elevated dialog shadow */
  '$dialog-shadow': '0 1x 4x #dark.15',
};
