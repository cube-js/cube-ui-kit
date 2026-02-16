/**
 * Glaze — color generation API for tasty themes.
 *
 * Generates robust light, dark, and high-contrast colors from a hue/saturation
 * seed, preserving contrast for UI pairs via explicit dependencies.
 *
 * See: src/THEME_GENERATOR.md
 */

import {
  formatOkhsl,
  okhslToLinearSrgb,
  relativeLuminanceFromLinearRgb,
} from '../utils/okhsl-color-math';

import {
  findLightnessForContrast,
  resolveMinContrast,
} from './contrast-solver';

import type {
  AdaptationMode,
  ColorDef,
  ColorMap,
  GlazeConfig,
  GlazeConfigResolved,
  GlazeExtendOptions,
  GlazeJsonOptions,
  GlazeOutputModes,
  GlazeTheme,
  GlazeTokenOptions,
  HCPair,
  MinContrast,
  ResolvedColor,
  ResolvedColorVariant,
} from './types';

// ============================================================================
// Global configuration
// ============================================================================

let globalConfig: GlazeConfigResolved = {
  darkLightness: [10, 90],
  darkDesaturation: 0.1,
  states: {
    dark: '@dark',
    highContrast: '@high-contrast',
  },
  modes: {
    dark: true,
    highContrast: false,
  },
};

// ============================================================================
// HCPair helpers
// ============================================================================

function pairNormal<T>(p: HCPair<T>): T {
  return Array.isArray(p) ? p[0] : p;
}

function pairHC<T>(p: HCPair<T>): T {
  return Array.isArray(p) ? p[1] : p;
}

// ============================================================================
// Validation
// ============================================================================

function validateColorDefs(defs: ColorMap): void {
  const names = new Set(Object.keys(defs));

  for (const [name, def] of Object.entries(defs)) {
    if (def.contrast !== undefined && !def.base) {
      throw new Error(`glaze: color "${name}" has "contrast" without "base".`);
    }

    if (def.l !== undefined && def.base !== undefined) {
      console.warn(
        `glaze: color "${name}" has both "l" and "base". "l" takes precedence.`,
      );
    }

    if (def.base && !names.has(def.base)) {
      throw new Error(
        `glaze: color "${name}" references non-existent base "${def.base}".`,
      );
    }

    if (def.l === undefined && def.base === undefined) {
      throw new Error(
        `glaze: color "${name}" must have either "l" (root) or "base" + "contrast" (dependent).`,
      );
    }
  }

  // Check for circular references
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(name: string): void {
    if (inStack.has(name)) {
      throw new Error(
        `glaze: circular base reference detected involving "${name}".`,
      );
    }
    if (visited.has(name)) return;

    inStack.add(name);
    const def = defs[name];
    if (def.base && def.l === undefined) {
      dfs(def.base);
    }
    inStack.delete(name);
    visited.add(name);
  }

  for (const name of names) {
    dfs(name);
  }
}

// ============================================================================
// Topological sort
// ============================================================================

function topoSort(defs: ColorMap): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);

    const def = defs[name];
    if (def.base && def.l === undefined) {
      visit(def.base);
    }

    result.push(name);
  }

  for (const name of Object.keys(defs)) {
    visit(name);
  }

  return result;
}

// ============================================================================
// Dark scheme mapping
// ============================================================================

function mapLightnessDark(l: number, mode: AdaptationMode): number {
  if (mode === 'static') return l;

  const [lo, hi] = globalConfig.darkLightness;

  if (mode === 'fixed') {
    // Mapped (not inverted) — brand colors stay recognizable
    return (l * (hi - lo)) / 100 + lo;
  }

  // auto — inverted
  return ((100 - l) * (hi - lo)) / 100 + lo;
}

function mapSaturationDark(s: number, mode: AdaptationMode): number {
  if (mode === 'static') return s;
  return s * (1 - globalConfig.darkDesaturation);
}

// ============================================================================
// Contrast sign resolution
// ============================================================================

/**
 * Resolve the effective lightness from a contrast delta.
 * See spec: "contrast sign convention".
 */
function resolveContrastLightness(
  baseLightness: number,
  contrast: number,
): number {
  if (contrast < 0) {
    // Explicit negative — darker than base
    return clamp(baseLightness + contrast, 0, 100);
  }

  // Positive or unsigned
  const candidate = baseLightness + contrast;
  if (candidate > 100) {
    // Flip to negative
    return clamp(baseLightness - contrast, 0, 100);
  }
  return clamp(candidate, 0, 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ============================================================================
// Color resolution engine
// ============================================================================

interface ResolveContext {
  hue: number;
  saturation: number;
  defs: ColorMap;
  resolved: Map<string, ResolvedColor>;
}

function resolveRootColor(
  name: string,
  def: ColorDef,
  ctx: ResolveContext,
  isHighContrast: boolean,
): { lightL: number; sat: number } {
  const rawL = def.l!;
  const lightL = clamp(
    isHighContrast ? pairHC(rawL) : pairNormal(rawL),
    0,
    100,
  );
  const sat = clamp(def.sat ?? 1, 0, 1);
  return { lightL, sat };
}

function resolveDependentColor(
  name: string,
  def: ColorDef,
  ctx: ResolveContext,
  isHighContrast: boolean,
  isDark: boolean,
): { l: number; sat: number } {
  const baseName = def.base!;
  const baseResolved = ctx.resolved.get(baseName);
  if (!baseResolved) {
    throw new Error(
      `glaze: base "${baseName}" not yet resolved for "${name}".`,
    );
  }

  const mode = def.mode ?? 'auto';
  const sat = clamp(def.sat ?? 1, 0, 1);

  // Get base lightness for the current scheme variant
  let baseL: number;
  if (isDark && isHighContrast) {
    baseL = baseResolved.darkContrast.l * 100;
  } else if (isDark) {
    baseL = baseResolved.dark.l * 100;
  } else if (isHighContrast) {
    baseL = baseResolved.lightContrast.l * 100;
  } else {
    baseL = baseResolved.light.l * 100;
  }

  // Resolve contrast delta
  const rawContrast = def.contrast ?? 0;
  let contrast = isHighContrast ? pairHC(rawContrast) : pairNormal(rawContrast);

  // In dark+auto mode, flip the contrast sign
  if (isDark && mode === 'auto') {
    contrast = -contrast;
  }

  const preferredL = resolveContrastLightness(baseL, contrast);

  // Apply minContrast if specified
  const rawMinContrast = def.minContrast;
  if (rawMinContrast !== undefined) {
    const minCr = isHighContrast
      ? pairHC(rawMinContrast)
      : pairNormal(rawMinContrast);

    const effectiveSat = isDark
      ? mapSaturationDark((sat * ctx.saturation) / 100, mode)
      : (sat * ctx.saturation) / 100;

    // Get base color in linear sRGB for contrast computation
    let baseH: number;
    let baseS: number;
    let baseLNorm: number;
    if (isDark && isHighContrast) {
      baseH = baseResolved.darkContrast.h;
      baseS = baseResolved.darkContrast.s;
      baseLNorm = baseResolved.darkContrast.l;
    } else if (isDark) {
      baseH = baseResolved.dark.h;
      baseS = baseResolved.dark.s;
      baseLNorm = baseResolved.dark.l;
    } else if (isHighContrast) {
      baseH = baseResolved.lightContrast.h;
      baseS = baseResolved.lightContrast.s;
      baseLNorm = baseResolved.lightContrast.l;
    } else {
      baseH = baseResolved.light.h;
      baseS = baseResolved.light.s;
      baseLNorm = baseResolved.light.l;
    }

    const baseLinearRgb = okhslToLinearSrgb(baseH, baseS, baseLNorm);

    const result = findLightnessForContrast({
      hue: ctx.hue,
      saturation: effectiveSat,
      preferredLightness: preferredL / 100,
      baseLinearRgb,
      minContrast: minCr,
    });

    return { l: result.lightness * 100, sat };
  }

  return { l: clamp(preferredL, 0, 100), sat };
}

function resolveColorForScheme(
  name: string,
  def: ColorDef,
  ctx: ResolveContext,
  isDark: boolean,
  isHighContrast: boolean,
): ResolvedColorVariant {
  const mode = def.mode ?? 'auto';
  const isRoot = def.l !== undefined;

  let lightL: number;
  let sat: number;

  if (isRoot) {
    const root = resolveRootColor(name, def, ctx, isHighContrast);
    lightL = root.lightL;
    sat = root.sat;
  } else {
    // Dependent color — resolved differently
    const dep = resolveDependentColor(name, def, ctx, isHighContrast, isDark);
    lightL = dep.l;
    sat = dep.sat;
  }

  // Apply dark mapping for root colors (dependent colors already account for dark base)
  let finalL: number;
  let finalSat: number;

  if (isDark && isRoot) {
    finalL = mapLightnessDark(lightL, mode);
    finalSat = mapSaturationDark((sat * ctx.saturation) / 100, mode);
  } else if (isDark && !isRoot) {
    // Dependent colors in dark mode: lightL is already computed against dark base
    finalL = lightL;
    finalSat = mapSaturationDark((sat * ctx.saturation) / 100, mode);
  } else {
    finalL = lightL;
    finalSat = (sat * ctx.saturation) / 100;
  }

  return {
    h: ctx.hue,
    s: clamp(finalSat, 0, 1),
    l: clamp(finalL / 100, 0, 1),
  };
}

function resolveAllColors(
  hue: number,
  saturation: number,
  defs: ColorMap,
): Map<string, ResolvedColor> {
  validateColorDefs(defs);
  const order = topoSort(defs);

  const ctx: ResolveContext = {
    hue,
    saturation,
    defs,
    resolved: new Map(),
  };

  // Resolve in four passes: light, dark, lightContrast, darkContrast
  // Each pass uses the same topological order.
  // We need to resolve all light variants first because dark depends on light for root colors.

  // Pass 1: Light normal
  const lightMap = new Map<string, ResolvedColorVariant>();
  for (const name of order) {
    const variant = resolveColorForScheme(name, defs[name], ctx, false, false);
    lightMap.set(name, variant);
    // Temporarily store so dependent colors can reference
    ctx.resolved.set(name, {
      name,
      light: variant,
      dark: variant, // placeholder
      lightContrast: variant, // placeholder
      darkContrast: variant, // placeholder
      mode: defs[name].mode ?? 'auto',
    });
  }

  // Pass 2: Light high-contrast
  const lightHCMap = new Map<string, ResolvedColorVariant>();
  // Reset resolved for HC pass
  for (const name of order) {
    ctx.resolved.set(name, {
      ...ctx.resolved.get(name)!,
      lightContrast: lightMap.get(name)!, // use light as fallback
    });
  }
  for (const name of order) {
    const variant = resolveColorForScheme(name, defs[name], ctx, false, true);
    lightHCMap.set(name, variant);
    ctx.resolved.set(name, {
      ...ctx.resolved.get(name)!,
      lightContrast: variant,
    });
  }

  // Pass 3: Dark normal — root colors need light L for inversion
  // For dark pass, root colors use their light L to compute dark L.
  // Dependent colors use the already-resolved dark base.
  // We need to resolve root colors first, then dependents.
  const darkMap = new Map<string, ResolvedColorVariant>();
  // First, set all resolved to have correct light values
  for (const name of order) {
    ctx.resolved.set(name, {
      name,
      light: lightMap.get(name)!,
      dark: lightMap.get(name)!, // placeholder for dark
      lightContrast: lightHCMap.get(name)!,
      darkContrast: lightHCMap.get(name)!, // placeholder
      mode: defs[name].mode ?? 'auto',
    });
  }
  for (const name of order) {
    const variant = resolveColorForScheme(name, defs[name], ctx, true, false);
    darkMap.set(name, variant);
    ctx.resolved.set(name, {
      ...ctx.resolved.get(name)!,
      dark: variant,
    });
  }

  // Pass 4: Dark high-contrast
  const darkHCMap = new Map<string, ResolvedColorVariant>();
  for (const name of order) {
    ctx.resolved.set(name, {
      ...ctx.resolved.get(name)!,
      darkContrast: darkMap.get(name)!, // use dark as fallback
    });
  }
  for (const name of order) {
    const variant = resolveColorForScheme(name, defs[name], ctx, true, true);
    darkHCMap.set(name, variant);
    ctx.resolved.set(name, {
      ...ctx.resolved.get(name)!,
      darkContrast: variant,
    });
  }

  // Build final result
  const result = new Map<string, ResolvedColor>();
  for (const name of order) {
    result.set(name, {
      name,
      light: lightMap.get(name)!,
      dark: darkMap.get(name)!,
      lightContrast: lightHCMap.get(name)!,
      darkContrast: darkHCMap.get(name)!,
      mode: defs[name].mode ?? 'auto',
    });
  }

  return result;
}

// ============================================================================
// Token formatting
// ============================================================================

function variantToOkhslString(v: ResolvedColorVariant): string {
  return formatOkhsl(v.h, v.s * 100, v.l * 100);
}

function resolveModes(override?: GlazeOutputModes): Required<GlazeOutputModes> {
  return {
    dark: override?.dark ?? globalConfig.modes.dark,
    highContrast: override?.highContrast ?? globalConfig.modes.highContrast,
  };
}

function buildTokenMap(
  resolved: Map<string, ResolvedColor>,
  prefix: string,
  states: { dark: string; highContrast: string },
  modes: Required<GlazeOutputModes>,
): Record<string, Record<string, string>> {
  const tokens: Record<string, Record<string, string>> = {};

  for (const [name, color] of resolved) {
    const key = `#${prefix}${name}`;
    const entry: Record<string, string> = {
      '': variantToOkhslString(color.light),
    };

    if (modes.dark) {
      entry[states.dark] = variantToOkhslString(color.dark);
    }
    if (modes.highContrast) {
      entry[states.highContrast] = variantToOkhslString(color.lightContrast);
    }
    if (modes.dark && modes.highContrast) {
      entry[`${states.dark} & ${states.highContrast}`] = variantToOkhslString(
        color.darkContrast,
      );
    }

    tokens[key] = entry;
  }

  return tokens;
}

function buildJsonMap(
  resolved: Map<string, ResolvedColor>,
  modes: Required<GlazeOutputModes>,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const [name, color] of resolved) {
    const entry: Record<string, string> = {
      light: variantToOkhslString(color.light),
    };

    if (modes.dark) {
      entry.dark = variantToOkhslString(color.dark);
    }
    if (modes.highContrast) {
      entry.lightContrast = variantToOkhslString(color.lightContrast);
    }
    if (modes.dark && modes.highContrast) {
      entry.darkContrast = variantToOkhslString(color.darkContrast);
    }

    result[name] = entry;
  }

  return result;
}

// ============================================================================
// Theme implementation
// ============================================================================

function createTheme(
  hue: number,
  saturation: number,
  initialColors?: ColorMap,
): GlazeTheme {
  let colorDefs: ColorMap = initialColors ? { ...initialColors } : {};

  const theme: GlazeTheme = {
    get hue() {
      return hue;
    },
    get saturation() {
      return saturation;
    },

    colors(defs: ColorMap): void {
      colorDefs = { ...defs };
    },

    extend(options: GlazeExtendOptions): GlazeTheme {
      const newHue = options.hue ?? hue;
      const newSat = options.saturation ?? saturation;
      const mergedColors = options.colors
        ? { ...colorDefs, ...options.colors }
        : { ...colorDefs };

      return createTheme(newHue, newSat, mergedColors);
    },

    resolve(): Map<string, ResolvedColor> {
      return resolveAllColors(hue, saturation, colorDefs);
    },

    tokens(
      options?: GlazeTokenOptions,
    ): Record<string, Record<string, string>> {
      const resolved = resolveAllColors(hue, saturation, colorDefs);
      const states = {
        dark: options?.states?.dark ?? globalConfig.states.dark,
        highContrast:
          options?.states?.highContrast ?? globalConfig.states.highContrast,
      };
      const modes = resolveModes(options?.modes);
      return buildTokenMap(resolved, '', states, modes);
    },

    json(options?: GlazeJsonOptions): Record<string, Record<string, string>> {
      const resolved = resolveAllColors(hue, saturation, colorDefs);
      const modes = resolveModes(options?.modes);
      return buildJsonMap(resolved, modes);
    },
  };

  return theme;
}

// ============================================================================
// Palette
// ============================================================================

interface PaletteInput {
  [name: string]: GlazeTheme;
}

function createPalette(themes: PaletteInput) {
  return {
    tokens(
      options?: GlazeTokenOptions,
    ): Record<string, Record<string, string>> {
      const states = {
        dark: options?.states?.dark ?? globalConfig.states.dark,
        highContrast:
          options?.states?.highContrast ?? globalConfig.states.highContrast,
      };
      const modes = resolveModes(options?.modes);

      const allTokens: Record<string, Record<string, string>> = {};

      for (const [themeName, theme] of Object.entries(themes)) {
        const resolved = theme.resolve();

        let prefix = '';
        if (options?.prefix === true) {
          prefix = `${themeName}-`;
        } else if (
          typeof options?.prefix === 'object' &&
          options.prefix !== null
        ) {
          prefix = options.prefix[themeName] ?? `${themeName}-`;
        }

        const tokens = buildTokenMap(resolved, prefix, states, modes);
        Object.assign(allTokens, tokens);
      }

      return allTokens;
    },

    json(
      options?: GlazeJsonOptions & {
        prefix?: boolean | Record<string, string>;
      },
    ): Record<string, Record<string, Record<string, string>>> {
      const modes = resolveModes(options?.modes);

      const result: Record<string, Record<string, Record<string, string>>> = {};

      for (const [themeName, theme] of Object.entries(themes)) {
        const resolved = theme.resolve();
        result[themeName] = buildJsonMap(resolved, modes);
      }

      return result;
    },
  };
}

// ============================================================================
// Public API: glaze()
// ============================================================================

/**
 * Create a single-hue glaze theme.
 *
 * @example
 * ```ts
 * const primary = glaze({ hue: 280, saturation: 80 });
 * // or shorthand:
 * const primary = glaze(280, 80);
 * ```
 */
export function glaze(
  hueOrOptions: number | { hue: number; saturation: number },
  saturation?: number,
): GlazeTheme {
  if (typeof hueOrOptions === 'number') {
    return createTheme(hueOrOptions, saturation ?? 100);
  }
  return createTheme(hueOrOptions.hue, hueOrOptions.saturation);
}

/**
 * Configure global glaze settings.
 */
glaze.configure = function configure(config: GlazeConfig): void {
  globalConfig = {
    darkLightness: config.darkLightness ?? globalConfig.darkLightness,
    darkDesaturation: config.darkDesaturation ?? globalConfig.darkDesaturation,
    states: {
      dark: config.states?.dark ?? globalConfig.states.dark,
      highContrast:
        config.states?.highContrast ?? globalConfig.states.highContrast,
    },
    modes: {
      dark: config.modes?.dark ?? globalConfig.modes.dark,
      highContrast:
        config.modes?.highContrast ?? globalConfig.modes.highContrast,
    },
  };
};

/**
 * Compose multiple themes into a palette.
 */
glaze.palette = function palette(themes: PaletteInput) {
  return createPalette(themes);
};

/**
 * Get the current global configuration (for testing/debugging).
 */
glaze.getConfig = function getConfig(): GlazeConfigResolved {
  return { ...globalConfig };
};

/**
 * Reset global configuration to defaults.
 */
glaze.resetConfig = function resetConfig(): void {
  globalConfig = {
    darkLightness: [10, 90],
    darkDesaturation: 0.1,
    states: {
      dark: '@dark',
      highContrast: '@high-contrast',
    },
    modes: {
      dark: true,
      highContrast: false,
    },
  };
};
