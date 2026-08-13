import { glaze } from '@tenphi/glaze';

/**
 * Turns a colour into the three numbers the palette is seeded from.
 *
 * A deliberate LEAF: it imports Glaze and nothing else. `./palette-config` reads it
 * from inside `resolveConfig`, and `./palette-config` is the one module the token
 * graph is not allowed to have a cycle through — so anything this file imported
 * would become a `palette-config` dependency too. Glaze has no edge back into the
 * token modules, so it is safe; `./palette` (which owns `TINT_RECIPE` and the global
 * `glaze.configure`) is not.
 *
 * There is no ordering hazard either, even though `./palette` runs
 * `glaze.configure()` at module scope and this file may be called before that
 * happens. A bare-string colour token defaults to `lightTone: false`, so its light
 * variant preserves the input tone exactly and its hue and saturation come straight
 * off the parse — all three readings are independent of the global config.
 */

/** Hue, saturation and tone read off a colour, on the palette's own scales. */
export interface ColorSeed {
  /** 0–360. */
  hue: number;
  /** 0–100 — the palette's seed scale, not Glaze's 0–1 factor. */
  saturation: number;
  /** 0–100 on the OKHST tone axis. */
  tone: number;
}

/**
 * A colour picker being dragged emits a distinct string per frame, and
 * `resolveConfig` runs on every `setPaletteConfig` *and* every
 * `resolvePaletteConfig` preview. One resolve is only ~3µs, so this is insurance
 * against a drag rather than a hot path — hence a cap and a clear rather than an
 * LRU.
 */
const CACHE_LIMIT = 256;
const cache = new Map<string, ColorSeed | null>();

/**
 * Read a colour's hue, saturation and tone.
 *
 * Accepts anything Glaze parses — hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()`,
 * `oklch()`. CSS colour keywords (`rebeccapurple`) are **not** supported.
 *
 * Returns `null` on anything unparseable, having warned once, so a caller can fall
 * back to its numeric seed instead of throwing on a typo in a settings field.
 *
 * ```ts
 * colorSeed('#0ea5e9'); // → { hue: 237.32, saturation: 98.19, tone: 65.78 }
 * ```
 */
export function colorSeed(value: string): ColorSeed | null {
  const cached = cache.get(value);

  // `null` is a cached FAILURE, not a miss — which is also what dedupes the
  // warning, so a bad value in a re-rendered config does not fill the console.
  if (cached !== undefined) return cached;

  let seed: ColorSeed | null = null;

  try {
    const { h, s, t } = glaze.color(value).resolve().light;

    // Glaze reports saturation and tone as 0–1 factors; the palette's are 0–100.
    seed = { hue: h, saturation: s * 100, tone: t * 100 };
  } catch {
    console.warn(
      `[cube-ui-kit] could not parse palette colour ${JSON.stringify(value)}; ` +
        `keeping the numeric seed. Accepted: hex, rgb(), hsl(), okhsl(), okhst(), ` +
        `oklch() — CSS colour keywords are not supported.`,
    );
  }

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(value, seed);

  return seed;
}
