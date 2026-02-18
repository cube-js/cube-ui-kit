/**
 * OKHSL Contrast Solver
 *
 * Finds the closest OKHSL lightness that satisfies a WCAG 2 contrast target
 * against a base color. Used by `glaze` when resolving dependent colors
 * with `minContrast`.
 *
 * See: src/tasty/utils/CONTRAST_SOLVER.spec.md
 */

import {
  contrastRatioFromLuminance,
  okhslToLinearSrgb,
  relativeLuminanceFromLinearRgb,
} from './okhsl-color-math';

// ============================================================================
// Types
// ============================================================================

export type ContrastPreset = 'AA' | 'AAA' | 'AA-large' | 'AAA-large';
export type MinContrast = number | ContrastPreset;

export interface FindLightnessForContrastOptions {
  /** Hue of the candidate color (0–360). */
  hue: number;
  /** Saturation of the candidate color (0–1). */
  saturation: number;
  /** Preferred lightness of the candidate (0–1). */
  preferredLightness: number;

  /** Base/reference color as linear sRGB (channels may be outside 0–1 before clamp). */
  baseLinearRgb: [number, number, number];

  /** WCAG contrast floor. */
  minContrast: MinContrast;

  /** Search bounds for lightness. Default: [0, 1]. */
  lightnessRange?: [number, number];
  /** Convergence threshold. Default: 1e-4. */
  epsilon?: number;
  /** Maximum binary-search iterations per branch. Default: 14. */
  maxIterations?: number;
}

export interface FindLightnessForContrastResult {
  /** Chosen lightness in 0–1. */
  lightness: number;
  /** Achieved WCAG contrast ratio. */
  contrast: number;
  /** Whether the target was reached. */
  met: boolean;
  /** Which branch was selected. */
  branch: 'lighter' | 'darker' | 'preferred';
}

// ============================================================================
// Preset mapping
// ============================================================================

const CONTRAST_PRESETS: Record<ContrastPreset, number> = {
  AA: 4.5,
  AAA: 7,
  'AA-large': 3,
  'AAA-large': 4.5,
};

export function resolveMinContrast(value: MinContrast): number {
  if (typeof value === 'number') {
    return Math.max(1, value);
  }
  return CONTRAST_PRESETS[value];
}

// ============================================================================
// LRU luminance cache
// ============================================================================

const CACHE_SIZE = 512;
const luminanceCache = new Map<string, number>();
const cacheOrder: string[] = [];

function cachedLuminance(h: number, s: number, l: number): number {
  const lRounded = Math.round(l * 10000) / 10000;
  const key = `${h}|${s}|${lRounded}`;

  const cached = luminanceCache.get(key);
  if (cached !== undefined) return cached;

  const linearRgb = okhslToLinearSrgb(h, s, lRounded);
  const y = relativeLuminanceFromLinearRgb(linearRgb);

  if (luminanceCache.size >= CACHE_SIZE) {
    const evict = cacheOrder.shift()!;
    luminanceCache.delete(evict);
  }
  luminanceCache.set(key, y);
  cacheOrder.push(key);

  return y;
}

// ============================================================================
// Solver
// ============================================================================

interface BranchResult {
  lightness: number;
  contrast: number;
  met: boolean;
}

/**
 * Binary search one branch [lo, hi] for the nearest passing lightness to `preferred`.
 * `direction` indicates whether we search lighter or darker from preferred.
 */
function searchBranch(
  h: number,
  s: number,
  lo: number,
  hi: number,
  yBase: number,
  target: number,
  epsilon: number,
  maxIter: number,
  preferred: number,
): BranchResult {
  // Check if the boundary can even reach the target
  const yLo = cachedLuminance(h, s, lo);
  const yHi = cachedLuminance(h, s, hi);
  const crLo = contrastRatioFromLuminance(yLo, yBase);
  const crHi = contrastRatioFromLuminance(yHi, yBase);

  // If neither boundary passes, return the best boundary
  if (crLo < target && crHi < target) {
    if (crLo >= crHi) {
      return { lightness: lo, contrast: crLo, met: false };
    }
    return { lightness: hi, contrast: crHi, met: false };
  }

  // Find the threshold lightness where contrast == target via bisection.
  // We want the lightness closest to `preferred` that still passes.
  let low = lo;
  let high = hi;

  for (let i = 0; i < maxIter; i++) {
    if (high - low < epsilon) break;

    const mid = (low + high) / 2;
    const yMid = cachedLuminance(h, s, mid);
    const crMid = contrastRatioFromLuminance(yMid, yBase);

    if (crMid >= target) {
      // mid passes — try to get closer to preferred
      if (mid < preferred) {
        low = mid;
      } else {
        high = mid;
      }
    } else {
      // mid fails — move away from preferred
      if (mid < preferred) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  // Pick the boundary that passes and is closest to preferred
  const yLow = cachedLuminance(h, s, low);
  const yHigh = cachedLuminance(h, s, high);
  const crLow = contrastRatioFromLuminance(yLow, yBase);
  const crHigh = contrastRatioFromLuminance(yHigh, yBase);

  const lowPasses = crLow >= target;
  const highPasses = crHigh >= target;

  if (lowPasses && highPasses) {
    // Both pass — pick closer to preferred
    if (Math.abs(low - preferred) <= Math.abs(high - preferred)) {
      return { lightness: low, contrast: crLow, met: true };
    }
    return { lightness: high, contrast: crHigh, met: true };
  }
  if (lowPasses) return { lightness: low, contrast: crLow, met: true };
  if (highPasses) return { lightness: high, contrast: crHigh, met: true };

  // Fallback: coarse scan for stability near gamut edges
  return coarseScan(h, s, lo, hi, yBase, target, epsilon, maxIter);
}

/**
 * Fallback coarse scan when binary search is unstable near gamut edges.
 */
function coarseScan(
  h: number,
  s: number,
  lo: number,
  hi: number,
  yBase: number,
  target: number,
  epsilon: number,
  maxIter: number,
): BranchResult {
  const STEPS = 64;
  const step = (hi - lo) / STEPS;
  let bestL = lo;
  let bestCr = 0;
  let bestMet = false;

  for (let i = 0; i <= STEPS; i++) {
    const l = lo + step * i;
    const y = cachedLuminance(h, s, l);
    const cr = contrastRatioFromLuminance(y, yBase);

    if (cr >= target && !bestMet) {
      bestL = l;
      bestCr = cr;
      bestMet = true;
    } else if (cr >= target && bestMet) {
      // Keep the one closest to the center of the range (most stable)
      bestL = l;
      bestCr = cr;
    } else if (!bestMet && cr > bestCr) {
      bestL = l;
      bestCr = cr;
    }
  }

  // Refine with bisection if we found a passing region
  if (bestMet && bestL > lo + step) {
    let rLo = bestL - step;
    let rHi = bestL;
    for (let i = 0; i < maxIter; i++) {
      if (rHi - rLo < epsilon) break;
      const mid = (rLo + rHi) / 2;
      const y = cachedLuminance(h, s, mid);
      const cr = contrastRatioFromLuminance(y, yBase);
      if (cr >= target) {
        rHi = mid;
        bestL = mid;
        bestCr = cr;
      } else {
        rLo = mid;
      }
    }
  }

  return { lightness: bestL, contrast: bestCr, met: bestMet };
}

/**
 * Find the OKHSL lightness that satisfies a WCAG 2 contrast target
 * against a base color, staying as close to `preferredLightness` as possible.
 */
export function findLightnessForContrast(
  options: FindLightnessForContrastOptions,
): FindLightnessForContrastResult {
  const {
    hue,
    saturation,
    preferredLightness,
    baseLinearRgb,
    minContrast: minContrastInput,
    lightnessRange = [0, 1],
    epsilon = 1e-4,
    maxIterations = 14,
  } = options;

  const target = resolveMinContrast(minContrastInput);
  const yBase = relativeLuminanceFromLinearRgb(baseLinearRgb);

  // Check if preferred lightness already satisfies the target
  const yPref = cachedLuminance(hue, saturation, preferredLightness);
  const crPref = contrastRatioFromLuminance(yPref, yBase);

  if (crPref >= target) {
    return {
      lightness: preferredLightness,
      contrast: crPref,
      met: true,
      branch: 'preferred',
    };
  }

  const [minL, maxL] = lightnessRange;

  // Search both branches
  const darkerResult =
    preferredLightness > minL
      ? searchBranch(
          hue,
          saturation,
          minL,
          preferredLightness,
          yBase,
          target,
          epsilon,
          maxIterations,
          preferredLightness,
        )
      : null;

  const lighterResult =
    preferredLightness < maxL
      ? searchBranch(
          hue,
          saturation,
          preferredLightness,
          maxL,
          yBase,
          target,
          epsilon,
          maxIterations,
          preferredLightness,
        )
      : null;

  // Pick the passing branch closest to preferred
  const darkerPasses = darkerResult?.met ?? false;
  const lighterPasses = lighterResult?.met ?? false;

  if (darkerPasses && lighterPasses) {
    const darkerDist = Math.abs(darkerResult!.lightness - preferredLightness);
    const lighterDist = Math.abs(lighterResult!.lightness - preferredLightness);
    if (darkerDist <= lighterDist) {
      return { ...darkerResult!, branch: 'darker' };
    }
    return { ...lighterResult!, branch: 'lighter' };
  }

  if (darkerPasses) {
    return { ...darkerResult!, branch: 'darker' };
  }

  if (lighterPasses) {
    return { ...lighterResult!, branch: 'lighter' };
  }

  // Neither branch passes — return the closest boundary candidate
  const candidates: (BranchResult & { branch: 'darker' | 'lighter' })[] = [];
  if (darkerResult) candidates.push({ ...darkerResult, branch: 'darker' });
  if (lighterResult) candidates.push({ ...lighterResult, branch: 'lighter' });

  if (candidates.length === 0) {
    return {
      lightness: preferredLightness,
      contrast: crPref,
      met: false,
      branch: 'preferred',
    };
  }

  // Return the one with the highest contrast
  candidates.sort((a, b) => b.contrast - a.contrast);
  return candidates[0];
}
