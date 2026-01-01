import type { Styles } from '../tasty/styles/types';

/**
 * Component size values in pixels.
 * Used for buttons, inputs, and other interactive elements.
 */
export const SIZES = {
  XS: 24,
  SM: 28,
  MD: 32,
  LG: 40,
  XL: 48,
} as const;

export type SizeKey = keyof typeof SIZES;

/** Human-readable size names */
export type SizeName = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Map from size names to size keys.
 * @example SIZE_NAME_TO_KEY['small'] // 'SM'
 */
export const SIZE_NAME_TO_KEY: Record<SizeName, SizeKey> = {
  xsmall: 'XS',
  small: 'SM',
  medium: 'MD',
  large: 'LG',
  xlarge: 'XL',
};

/** @deprecated Use SIZE_NAME_TO_KEY instead */
export const SIZES_MAP = SIZE_NAME_TO_KEY;

/**
 * Size tokens with $ prefix for CSS custom properties.
 * Creates tokens like `$size-xs`, `$size-sm`, etc.
 */
export const SIZE_TOKENS: Styles = {
  '$size-xs': `${SIZES.XS}px`,
  '$size-sm': `${SIZES.SM}px`,
  '$size-md': `${SIZES.MD}px`,
  '$size-lg': `${SIZES.LG}px`,
  '$size-xl': `${SIZES.XL}px`,
};
