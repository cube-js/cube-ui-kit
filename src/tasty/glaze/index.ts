/**
 * Glaze — color generation API for tasty themes.
 *
 * Can be imported from:
 * - `@cube-dev/ui-kit` (main bundle)
 * - `@cube-dev/ui-kit/tasty` (tasty bundle)
 * - `@cube-dev/ui-kit/tasty/glaze` (standalone, tree-shakeable)
 */

export { glaze } from './glaze';

// Re-export types for consumers
export type {
  HCPair,
  MinContrast,
  AdaptationMode,
  GlazeOutputModes,
  ColorDef,
  ColorMap,
  ResolvedColor,
  ResolvedColorVariant,
  GlazeConfig,
  GlazeTheme,
  GlazeExtendOptions,
  GlazeTokenOptions,
  GlazeJsonOptions,
  GlazePalette,
} from './types';

// Re-export contrast solver utilities for advanced use
export {
  findLightnessForContrast,
  resolveMinContrast,
} from './contrast-solver';
export type {
  ContrastPreset,
  FindLightnessForContrastOptions,
  FindLightnessForContrastResult,
} from './contrast-solver';

// Re-export color math for advanced use
export {
  okhslToLinearSrgb,
  okhslToSrgb,
  relativeLuminanceFromLinearRgb,
  contrastRatioFromLuminance,
  formatOkhsl,
} from './okhsl-color-math';
