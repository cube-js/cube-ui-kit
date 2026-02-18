/**
 * Glaze type definitions.
 */

import type { ContrastPreset } from './contrast-solver';

// ============================================================================
// Value types
// ============================================================================

/** A value or [normal, high-contrast] pair. */
export type HCPair<T> = T | [T, T];

export type MinContrast = number | ContrastPreset;

export type AdaptationMode = 'auto' | 'fixed' | 'static';

/**
 * Controls which scheme variants are generated in the export.
 * Light is always included (it's the default).
 */
export interface GlazeOutputModes {
  /** Include dark scheme variants. Default: true. */
  dark?: boolean;
  /** Include high-contrast variants (both light-HC and dark-HC). Default: false. */
  highContrast?: boolean;
}

// ============================================================================
// Color definitions
// ============================================================================

export interface ColorDef {
  /** Lightness in the light scheme (0–100). Root color. */
  l?: HCPair<number>;
  /** Saturation factor applied to the seed saturation (0–1, default: 1). */
  sat?: number;

  /** Name of another color in the same theme (dependent color). */
  base?: string;
  /** Lightness delta from the base color. */
  contrast?: HCPair<number>;
  /** WCAG contrast floor against the base. */
  minContrast?: HCPair<MinContrast>;

  /** Adaptation mode. Default: 'auto'. */
  mode?: AdaptationMode;
}

export type ColorMap = Record<string, ColorDef>;

// ============================================================================
// Resolved internal types
// ============================================================================

/** Resolved color for a single scheme variant. */
export interface ResolvedColorVariant {
  /** OKHSL hue (0–360). */
  h: number;
  /** OKHSL saturation (0–1). */
  s: number;
  /** OKHSL lightness (0–1). */
  l: number;
}

/** Fully resolved color across all scheme variants. */
export interface ResolvedColor {
  name: string;
  light: ResolvedColorVariant;
  dark: ResolvedColorVariant;
  lightContrast: ResolvedColorVariant;
  darkContrast: ResolvedColorVariant;
  mode: AdaptationMode;
}

// ============================================================================
// Configuration
// ============================================================================

export interface GlazeConfig {
  /** Dark scheme lightness window [lo, hi]. Default: [10, 90]. */
  darkLightness?: [number, number];
  /** Saturation reduction factor for dark scheme (0–1). Default: 0.1. */
  darkDesaturation?: number;
  /** State alias names for token export. */
  states?: {
    dark?: string;
    highContrast?: string;
  };
  /** Which scheme variants to include in exports. Default: both true. */
  modes?: GlazeOutputModes;
}

export interface GlazeConfigResolved {
  darkLightness: [number, number];
  darkDesaturation: number;
  states: {
    dark: string;
    highContrast: string;
  };
  modes: Required<GlazeOutputModes>;
}

// ============================================================================
// Theme API
// ============================================================================

export interface GlazeTheme {
  /** The hue seed (0–360). */
  readonly hue: number;
  /** The saturation seed (0–100). */
  readonly saturation: number;

  /** Define colors for this theme (replaces all previous definitions). */
  colors(defs: ColorMap): void;

  /** Create a child theme inheriting all color definitions. */
  extend(options: GlazeExtendOptions): GlazeTheme;

  /** Resolve all colors and return the result map. */
  resolve(): Map<string, ResolvedColor>;

  /** Export as tasty token map. */
  tokens(options?: GlazeTokenOptions): Record<string, Record<string, string>>;

  /** Export as plain JSON. */
  json(options?: GlazeJsonOptions): Record<string, Record<string, string>>;
}

export interface GlazeExtendOptions {
  hue?: number;
  saturation?: number;
  colors?: ColorMap;
}

// ============================================================================
// Palette API
// ============================================================================

export interface GlazeTokenOptions {
  /** Prefix mode. `true` uses "<themeName>-", or provide a custom map. */
  prefix?: boolean | Record<string, string>;
  /** Override state aliases for this export. */
  states?: {
    dark?: string;
    highContrast?: string;
  };
  /** Override which scheme variants to include. */
  modes?: GlazeOutputModes;
}

export interface GlazeJsonOptions {
  /** Override which scheme variants to include. */
  modes?: GlazeOutputModes;
}

export interface GlazePalette {
  /** Export all themes as a combined tasty token map. */
  tokens(options?: GlazeTokenOptions): Record<string, Record<string, string>>;

  /** Export all themes as plain JSON. */
  json(
    options?: GlazeJsonOptions & {
      prefix?: boolean | Record<string, string>;
    },
  ): Record<string, Record<string, Record<string, string>>>;
}
