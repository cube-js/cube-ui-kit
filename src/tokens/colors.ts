import type { Styles } from '../tasty/styles/types';

// ============================================================================
// Color Constants (OKHSL)
// ============================================================================

// Hue values (degrees)
export const PINK_HUE = 5.0;
export const PURPLE_HUE = 280.3;
export const DANGER_HUE = 23.1;
export const SUCCESS_HUE = 156.9;
export const WARNING_HUE = 84.3;
export const NOTE_HUE = 302.3;

// Saturation values (%)
export const MAIN_SATURATION = 80;
export const BG_SATURATION = 60;
export const ICON_SATURATION = 75;

// Lightness values (%)
export const MAIN_LIGHTNESS = 52;
export const TEXT_LIGHTNESS = 45;
export const BG_LIGHTNESS = 97;
export const ICON_LIGHTNESS = 60;

// ============================================================================
// Helper function
// ============================================================================

/** Generate an OKHSL color string */
const okhsl = (h: number, s: number, l: number): string =>
  `okhsl(${h} ${s}% ${l}%)`;

// ============================================================================
// Color Tokens
// ============================================================================

/**
 * Color tokens with # prefix for tasty color definitions.
 * The tasty system automatically generates {name}-color-rgb variants.
 * Colors are defined in OKHSL format for perceptually uniform color manipulation.
 */
export const COLOR_TOKENS: Styles = {
  // Base colors - Pink
  '#pink': okhsl(PINK_HUE, 100, 67),

  // Base colors - Purple (primary)
  '#purple': okhsl(PURPLE_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
  '#purple-text': okhsl(PURPLE_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
  '#purple-bg': okhsl(PURPLE_HUE, BG_SATURATION, BG_LIGHTNESS), // Unused
  '#purple-icon': okhsl(PURPLE_HUE, ICON_SATURATION, ICON_LIGHTNESS), // Unused
  '#purple-01': okhsl(PURPLE_HUE, 100, 58), // Unused
  '#purple-02': okhsl(PURPLE_HUE, 100, 66), // Unused
  '#purple-03': okhsl(PURPLE_HUE, 100, 74),
  '#purple-04': okhsl(PURPLE_HUE, 100, 83),

  // Focus
  '#focus': okhsl(PURPLE_HUE, 69, 71),

  // Text
  '#text': okhsl(PURPLE_HUE, 27, 41),

  // Dark
  '#dark': okhsl(PURPLE_HUE, 38, 12),
  '#dark-01': okhsl(PURPLE_HUE, 38, 12),
  '#dark-02': okhsl(PURPLE_HUE, 30, 31),
  '#dark-03': okhsl(PURPLE_HUE, 19, 49),
  '#dark-04': okhsl(PURPLE_HUE, 14, 67),
  '#dark-05': okhsl(PURPLE_HUE, 14, 86),
  '#dark-bg': okhsl(PURPLE_HUE, 21, 98),

  // Light
  '#light': okhsl(PURPLE_HUE, 14, 97),

  // Black & White
  '#white': 'okhsl(0 0% 100%)',
  '#black': 'okhsl(0 0% 0%)',

  // Danger (red)
  '#danger': okhsl(DANGER_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
  '#danger-text': okhsl(DANGER_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
  '#danger-bg': okhsl(DANGER_HUE, BG_SATURATION, BG_LIGHTNESS),
  '#danger-icon': okhsl(DANGER_HUE, ICON_SATURATION, ICON_LIGHTNESS),

  // Success (green)
  '#success': okhsl(SUCCESS_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
  '#success-text': okhsl(SUCCESS_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
  '#success-bg': okhsl(SUCCESS_HUE, BG_SATURATION, BG_LIGHTNESS),
  '#success-icon': okhsl(SUCCESS_HUE, ICON_SATURATION, ICON_LIGHTNESS),

  // Warning (yellow/amber)
  '#warning': okhsl(WARNING_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
  '#warning-text': okhsl(WARNING_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
  '#warning-bg': okhsl(WARNING_HUE, BG_SATURATION, BG_LIGHTNESS),
  '#warning-icon': okhsl(WARNING_HUE, ICON_SATURATION, ICON_LIGHTNESS),

  // Note (violet)
  '#note': okhsl(NOTE_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
  '#note-text': okhsl(NOTE_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
  '#note-bg': okhsl(NOTE_HUE, BG_SATURATION, BG_LIGHTNESS),
  '#note-icon': okhsl(NOTE_HUE, ICON_SATURATION, ICON_LIGHTNESS),

  // Border
  '#border': okhsl(PURPLE_HUE, 13, 90),

  '#placeholder': '#dark-04',

  // Semantic colors
  '#clear': 'transparent',
  '#shadow': '#dark.06',
  '#minor': '#dark.65',
  '#primary': '#purple',

  // Disabled state colors
  '#disabled': '#dark-01.25',
  '#disabled-text': '#dark-01.25',
  '#disabled-bg': '#dark-05.2',
};
