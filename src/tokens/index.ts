/**
 * Design tokens for the Cube UI Kit.
 *
 * This module exports all design tokens used throughout the design system.
 * All token keys use $ prefix for CSS custom properties.
 *
 * Categories:
 * - Colors: Base color palette, each emitted as a -color variable
 * - Typography: Font presets for headings, text, paragraphs, etc.
 * - Sizes: Component size values (XS, SM, MD, LG, XL)
 * - Spacing: Space tokens using gap multipliers
 * - Shadows: Shadow definitions for elevation
 * - Layout: Common layout dimensions
 * - Base: Core design system values
 */

export { getTokens, TOKENS } from './all-tokens';
// Reads a token's RESOLVED value out of the DOM, for consumers rendering into a
// surface our stylesheets do not reach — a third-party iframe, an editor theme,
// a chart spec — where `var(--…)` means nothing.
export {
  resolvePresetValues,
  resolveTokenValue,
  resolveTokenValues,
  usePresetValues,
  useTokenValue,
  useTokenValues,
} from './resolve';
export type { ResolvedPreset, ResolveTokenOptions } from './resolve';
// Turns the `oklch(...)` a resolved color token computes to into something a
// third-party parser will accept, rather than silently drop.
export { toLegacyColor } from './legacy-color';
export type { LegacyAlphaFormat, ToLegacyColorOptions } from './legacy-color';

// Re-export category modules for direct access
export { COLOR_TOKENS, getColorTokens, renderColorTokens } from './colors';
// Reads hue / saturation / tone off a colour — what the palette's `accentColor` and
// `baseColor` seeds are resolved through.
export { colorSeed } from './color-seed';
export type { ColorSeed } from './color-seed';
// Adaptive one-off themes built at runtime from an arbitrary hue, named by a
// hash of their config so identical requests share one injection.
export { colorThemeSeed, getColorTheme, useColorTheme } from './color-theme';
export type { ColorTheme, ColorThemeConfig } from './color-theme';
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
  MAX_BASE_SATURATION,
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
  PaletteNumericSeed,
  PaletteSeed,
  PaletteThemeName,
  ResolvedPaletteConfig,
  ResolvedThemeSeed,
  SurfaceMode,
} from './palette-config';
export { SIZES, SIZE_NAME_TO_KEY, SIZE_TOKENS } from './sizes';
export type { SizeKey, SizeName } from './sizes';
export { SPACE_TOKENS } from './spacing';
export { SHADOW_TOKENS } from './shadows';
export { LAYOUT_TOKENS } from './layout';
export { BASE_TOKENS } from './base';
export { TYPOGRAPHY_PRESETS } from './typography';
