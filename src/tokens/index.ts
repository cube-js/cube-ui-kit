/**
 * Design tokens for the Cube UI Kit.
 *
 * This module exports all design tokens used throughout the design system.
 * All token keys use $ prefix for CSS custom properties.
 *
 * Categories:
 * - Colors: Base color palette with -color and -color-rgb variants
 * - Typography: Font presets for headings, text, paragraphs, etc.
 * - Sizes: Component size values (XS, SM, MD, LG, XL)
 * - Spacing: Space tokens using gap multipliers
 * - Shadows: Shadow definitions for elevation
 * - Layout: Common layout dimensions
 * - Base: Core design system values
 */

import { generateTypographyTokens } from '../tasty/utils/typography';

import { BASE_TOKENS } from './base';
import { COLOR_TOKENS } from './colors';
import { LAYOUT_TOKENS } from './layout';
import { SHADOW_TOKENS } from './shadows';
import { SIZE_NAME_TO_KEY, SIZE_TOKENS, SIZES } from './sizes';
import { SPACE_TOKENS } from './spacing';

import type { Styles } from '../tasty/styles/types';
import type { SizeKey, SizeName } from './sizes';

/**
 * All design tokens combined into a single Styles object.
 * Keys use $ prefix for CSS custom properties.
 *
 * Ready for use with useGlobalStyles('body', TOKENS).
 *
 * Includes:
 * - Base tokens ($gap, $radius, etc.)
 * - Space tokens ($space-xs, $space-sm, etc.)
 * - Size tokens ($size-xs, $size-sm, etc.)
 * - Shadow tokens ($item-shadow, $card-shadow, etc.)
 * - Layout tokens ($max-content-width, $topbar-height, etc.)
 * - Typography tokens ($h1-font-size, $t3-line-height, etc.)
 * - Color tokens ($purple-color, $purple-color-rgb, etc.)
 */
export const TOKENS: Styles = {
  ...BASE_TOKENS,
  ...SPACE_TOKENS,
  ...SIZE_TOKENS,
  ...SHADOW_TOKENS,
  ...LAYOUT_TOKENS,
  ...generateTypographyTokens(),
  ...COLOR_TOKENS,
};

// Re-export category modules for direct access
export { COLOR_TOKENS } from './colors';
export { SIZES, SIZE_NAME_TO_KEY, SIZE_TOKENS } from './sizes';
export type { SizeKey, SizeName } from './sizes';
export { SPACE_TOKENS } from './spacing';
export { SHADOW_TOKENS } from './shadows';
export { LAYOUT_TOKENS } from './layout';
export { BASE_TOKENS } from './base';
export { TYPOGRAPHY_PRESETS } from './typography';
export type { TypographyPreset } from './typography';
