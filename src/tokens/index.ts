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

import { generateTypographyTokens } from '@tenphi/tasty';

import { BASE_TOKENS } from './base';
import { getColorTokens } from './colors';
import { LAYOUT_TOKENS } from './layout';
import { lazyStyles } from './lazy-styles';
import { getPaletteVersion } from './palette-config';
import { SHADOW_TOKENS } from './shadows';
import { SIZE_TOKENS } from './sizes';
import { SPACE_TOKENS } from './spacing';
import { TYPOGRAPHY_PRESETS } from './typography';

import type { Styles } from '@tenphi/tasty';
import type { SizeKey, SizeName } from './sizes';

/**
 * All design tokens combined into a single Styles object.
 * Keys use $ prefix for CSS custom properties.
 *
 * Color tokens resolve against the current palette config (see
 * {@link getColorTokens}), and this map is memoized against that config's
 * version so `setPaletteConfig()` invalidates it. Prefer this over the lazy
 * {@link TOKENS} proxy when applying styles from React (`GlobalStyles`).
 *
 * Includes:
 * - Base tokens ($gap, $radius, etc.)
 * - Space tokens ($space-xs, $space-sm, etc.)
 * - Size tokens ($size-xs, $size-sm, etc.)
 * - Shadow tokens ($shadow, $item-shadow, etc.)
 * - Layout tokens ($max-content-width, $topbar-height, etc.)
 * - Typography tokens ($h1-font-size, $t3-line-height, etc.)
 * - Color tokens ($purple-color, $purple-color-rgb, etc.)
 */
let tokensCache: Styles | null = null;
let cachedVersion = -1;

export function getTokens(): Styles {
  const version = getPaletteVersion();

  if (!tokensCache || cachedVersion !== version) {
    tokensCache = {
      ...BASE_TOKENS,
      ...SPACE_TOKENS,
      ...SIZE_TOKENS,
      ...SHADOW_TOKENS,
      ...LAYOUT_TOKENS,
      ...generateTypographyTokens(TYPOGRAPHY_PRESETS),
      ...getColorTokens(),
    };
    cachedVersion = version;
  }
  return tokensCache;
}

/** Lazy proxy of {@link getTokens}. Prefer `getTokens()` in new code. */
export const TOKENS: Styles = lazyStyles(getTokens);

// Re-export category modules for direct access
export { COLOR_TOKENS, getColorTokens, renderColorTokens } from './colors';
export {
  getCodeTheme,
  getPalette,
  getPaletteTokens,
  PALETTE_TOKENS,
  renderPaletteTokens,
} from './palette';
export type { RenderPaletteOptions } from './palette';
export {
  DEFAULT_PALETTE_CONFIG,
  getPaletteConfig,
  getPaletteConfigInput,
  invalidatePaletteTokens,
  resetPaletteConfig,
  resolvePaletteConfig,
  setPaletteConfig,
  subscribePaletteConfig,
  usePaletteConfig,
  usePaletteVersion,
} from './palette-config';
export type {
  PaletteCodeSeed,
  PaletteConfig,
  PaletteThemeName,
  PaletteThemeSeed,
  ResolvedPaletteConfig,
} from './palette-config';
export { SIZES, SIZE_NAME_TO_KEY, SIZE_TOKENS } from './sizes';
export type { SizeKey, SizeName } from './sizes';
export { SPACE_TOKENS } from './spacing';
export { SHADOW_TOKENS } from './shadows';
export { LAYOUT_TOKENS } from './layout';
export { BASE_TOKENS } from './base';
export { TYPOGRAPHY_PRESETS } from './typography';
