import { useSyncExternalStore } from 'react';

import { colorSeed } from './color-seed';

/**
 * Runtime configuration for the Glaze-generated color palette.
 *
 * The palette recipe itself lives in `./palette.ts`; this module owns only the
 * *seeds* it is built from, plus a version counter the token caches watch. Its only
 * import is the leaf `./color-seed` helper — never the token modules — so there is
 * no import cycle and no ordering hazard. See that file for why reading a colour
 * cannot depend on the global Glaze config `./palette.ts` installs.
 *
 * Reading is free; writing rebuilds the palette on the next token read. See
 * `Getting Started/Theming` in Storybook for the full contract.
 */

// ============================================================================
// Default seeds
// ============================================================================

/** Brand hue. Drives the `default`, `primary`, `purple` and `special` themes. */
export const DEFAULT_HUE = 280.3;
export const DEFAULT_SUCCESS_HUE = 156.9;
export const DEFAULT_DANGER_HUE = 23.1;
export const DEFAULT_WARNING_HUE = 84.3;
export const DEFAULT_NOTE_HUE = 302.3;

/** Seed saturation. Per-color `saturation` in the recipe is a 0–1 factor of it. */
export const DEFAULT_SATURATION = 100;

/**
 * Share of {@link DEFAULT_SATURATION} the neutral `surface` carries — the recipe's
 * own `SURFACE_SATURATION` factor, as a fraction.
 *
 * It lives here rather than in the recipe because the dependency runs one way:
 * `./palette.ts` imports the config, not the reverse — and the config needs this
 * number to default `baseSaturation`. It is the anchor of the base zone's own 0–100
 * scale: the share the *accent zone* lends the chrome when no `baseColor` names one
 * outright, so an untouched palette lands on `12`.
 */
export const SURFACE_SATURATION_SHARE = 0.12;

/**
 * Ceiling on a base saturation derived from a {@link PaletteConfig.base} color.
 *
 * A named base color lands the chrome near itself rather than at the 12% share the
 * accent lends it, which is the whole reason to name one — but a fully saturated
 * chrome stops being chrome. `50` is well past where the base colors begin to
 * converge (`surface-inverse` tops out around `25`), so the clip costs nothing that
 * was still moving and stops a vivid brand hex from being read as an instruction to
 * paint the page with it.
 *
 * The manual slider in the tuner shares the number, so the two agree on what the top
 * of the range means.
 */
export const MAX_BASE_SATURATION = 50;

/**
 * Seed saturation for the `code-*` syntax family, deliberately **not** the same
 * constant as {@link DEFAULT_SATURATION}.
 *
 * The two were one value until the app seed moved to 100 for the pastel palette.
 * Sharing it would have dragged the syntax colors along for the ride — the exact
 * coupling that `PaletteCodeSeed` and the `pastel` opt-out both exist to prevent,
 * and the reason the code family answers to its own saturation and nothing else.
 * Splitting the constant is what lets the app seed move while the code palette
 * stays on the value it was calibrated against.
 */
export const DEFAULT_CODE_SATURATION = 80;

// ============================================================================
// Types
// ============================================================================

/** The numeric arm of a {@link PaletteSeed}. */
export interface PaletteNumericSeed {
  /** Hue in degrees (0–360). */
  hue?: number;
  /** Saturation (0–100). */
  saturation?: number;
}

/**
 * One zone's seed: a **color**, or the **numbers**.
 *
 * A string is a color — anything Glaze parses: hex, `rgb()`, `hsl()`, `okhsl()`,
 * `okhst()`, `oklch()`. CSS color keywords (`rebeccapurple`) are not supported, and an
 * unparseable value warns once and falls back to the numeric path with nothing pinned.
 *
 * The union **is** the exclusivity. A zone is seeded one way or the other — never both,
 * never layered — so there is no precedence rule to learn and no contradiction to warn
 * about. It also means a patch that switches form *replaces* rather than merges; layering
 * happens within a path. See {@link resolvePaletteConfig}.
 *
 * What a color supplies differs by zone, and each zone's own field says so:
 * {@link PaletteConfig.accent} keeps the tone but lends the palette none of its chroma,
 * {@link PaletteConfig.base} discards the tone, and a status theme keeps the tone *and*
 * takes the chroma as its seed.
 */
export type PaletteSeed = string | PaletteNumericSeed;

/**
 * The `code-*` syntax family takes a saturation and nothing else — and answers to
 * nothing else either. This is the one knob that moves it.
 *
 * Its hues are absolute literals by design, so syntax colors never rotate with the
 * brand — strings would collide with numbers the moment the brand went green, which is
 * also why it is not a {@link PaletteSeed} and cannot take a color. Unlike every other
 * theme, its saturation does **not** inherit the palette-level one: the code palette is
 * calibrated once and stays there, so re-seeding the app cannot quietly wash out a code
 * block. {@link PaletteConfig.pastel} skips it for the same reason.
 */
export interface PaletteCodeSeed {
  /** Saturation (0–100). Defaults to {@link DEFAULT_CODE_SATURATION}, not to the accent's. */
  saturation?: number;
}

/**
 * Where the neutral surface ramp sits on the tone scale — see
 * {@link PaletteConfig.surfaceMode}.
 */
export type SurfaceMode = 'neutral' | 'tinted';

/** Names of the themes whose seeds can be overridden individually. */
export type PaletteThemeName =
  | 'success'
  | 'danger'
  | 'warning'
  | 'note'
  | 'code';

/**
 * Palette tuning. Every field is optional; omitted fields keep their default, and
 * per-theme fields left unset inherit the palette-level value.
 *
 * Every zone takes the same {@link PaletteSeed} — a color or the numbers — so the whole
 * config is one idea spelled once, and a settings UI can drive all six zones with one
 * control.
 */
export interface PaletteConfig {
  /**
   * The **accent** zone — the brand. Drives the `accent-*` family on every theme,
   * `primary` / `purple` / `special`, and the brand-tinted odds and ends (`focus`, the
   * loading faces, the disabled chip). Its hue is also the default for
   * {@link PaletteConfig.base}, and its saturation the default every status theme
   * inherits.
   *
   * **As numbers** — `{ hue, saturation }`. One saturation scale for the whole theme, by
   * design: every color's own `saturation` is a 0–1 factor of this seed — `surface` at
   * 0.12, `border` at 0.175, the text ramp at 0.2, the accent family at ~1.0 — so moving
   * it rescales the palette while keeping those proportions. Unlike hue, which is
   * configured separately for the brand and for each status theme, saturation is
   * deliberately not split: the ratio between a subtle surface tint and a saturated
   * accent is part of the design.
   *
   * A `saturation` **belongs to the non-pastel path**, and writing one says so: with no
   * {@link PaletteConfig.pastel} beside it, it turns pastel off, because tuning a
   * saturation is the non-pastel path by definition. Pastel is one flat chroma ceiling,
   * so under it there is exactly one seed and it is the top of the scale. A
   * `pastel: true` written next to a saturation wins and the saturation is ignored (with
   * a dev warning) — but it is kept rather than dropped, so turning pastel back off
   * restores your number.
   *
   * **As a color** — the brand, as you have it. Unlike a
   * {@link PaletteConfig.base} color, which keeps only hue and saturation, this keeps
   * the **tone** as well — which is the whole point. Without it the brand fill is
   * authored as a fixed tone step off white, so every accent hue lands at roughly the
   * same lightness and the color you asked for never actually appears.
   *
   * The **light, normal-contrast** variant reproduces the color; dark and high contrast
   * adapt, as every other color in the palette does. Two things cost exactness even
   * there: {@link PaletteConfig.pastel} caps chroma (so `#FFD400` softens), and the fill
   * answers to two APCA floors of deliberately different sizes — **Lc 45 against the
   * white label** it carries, because a label is text, and only **Lc 25 against
   * `surface`**, because a fill is a shape. It moves as far as the nearer one requires
   * and no further.
   *
   * Those floors are APCA, not WCAG, and the difference is deliberate: one WCAG ratio
   * means two very different things by scheme (3:1 measures Lc 56 in light but only
   * Lc 23 in dark), which crushed light brands while letting dark ones through. A
   * consequence worth stating plainly — **the emitted fill can sit below WCAG 3:1**.
   * `#0EA5E9` renders at 2.77:1 against a white page and is correct at that value; the
   * Lc is the guarantee, not the ratio.
   *
   * A color's own chroma is **not** adopted as the zone's seed saturation, which stays at
   * its default. The accent family gets the chroma through Glaze's `from`, where it is
   * absolute and seed-independent, and leaving the seed alone is what keeps a saturated
   * brand out of every status theme that inherits it. A status theme's color behaves the
   * other way round for the same reason inverted — nothing inherits from a status theme.
   */
  accent?: PaletteSeed;
  /**
   * The **base** zone: the neutral chrome — `surface` and its ladder, the
   * `surface-text*` ramp, `border`, `placeholder`.
   *
   * **Omit it and the zone follows the accent** — the chrome carries a faint tint of the
   * brand, at {@link SURFACE_SATURATION_SHARE} of its chroma, unless you say otherwise.
   * That is the third state, and the reason this field is worth reading back from
   * {@link getPaletteConfigInput}: absent, an object, or a string are three different
   * answers to "does the chrome have a seed of its own".
   *
   * **As numbers** — `{ hue, saturation }`, each independently optional. Splitting the
   * hue off lets the chrome sit on a different one from the accent — a warm grey UI with
   * a cool blue brand, say. Only the `default` theme is affected: a colored theme's
   * tinted `surface` deliberately follows *its own* hue, because a danger banner should
   * read as red.
   *
   * The saturation is on the same 0–100 scale as the accent's, and read the same way.
   * **The shipped chrome is `12`** — a faint tint is what a neutral surface is — so the
   * useful range is mostly below a third, and the numbers above it are a deliberately
   * tinted theme rather than a neutral one. Set it and the base zone stops following the
   * brand: a vivid accent over near-grey chrome, or a muted accent over visibly warm
   * chrome, are both one number away and neither is reachable from a single scale.
   *
   * The base colors keep their proportions to one another — `border` more than `surface`,
   * the text ramp more than `border` — until the highest of them hits the top of the
   * scale, which happens around `25`. Past that they converge.
   *
   * Under {@link PaletteConfig.surfaceMode} `'neutral'` it reaches `surface-2`…
   * `surface-4`, `border`, `placeholder` and the text ramp, but not the page surface: at
   * the end of the tone scale there is no room for chroma, whatever the seed says.
   * `'tinted'` is what gives it somewhere to land.
   *
   * **As a color** — its **hue and saturation** are read; its **tone is discarded**,
   * because the chrome's lightness ladder is the design. A base color says which way the
   * greys lean and how far, not how dark they are.
   *
   * The saturation is clipped to {@link MAX_BASE_SATURATION}. Naming a base color says
   * "the chrome is this color", so it lands near it rather than at the share it would
   * inherit from the accent — but a fully saturated chrome is no longer chrome, so there
   * is a ceiling on how far "near" goes.
   *
   * Unlike the accent's, writing a base saturation does *not* turn pastel off: how much
   * hue the chrome carries says nothing about which chroma space the palette is in.
   */
  base?: PaletteSeed;
  /**
   * Global. Where the neutral surface ramp sits on the tone scale.
   *
   * - `'neutral'` — `surface` is the extreme: pure white in light, the darkest
   *   step the dark tone window allows in dark. No room for chroma, so the page
   *   carries no hue however saturated the base zone is.
   * - `'tinted'` — the whole ramp moves two tones inward, off the extreme.
   *
   * Two tones is not a visible lightness change; what it buys is *room*. Chroma
   * needs distance from white to exist at all, so at the extreme a light page is
   * white no matter what the base saturation says. Tinted trades two tones of
   * headroom for a page that actually carries its base hue.
   *
   * Everything below `surface` is positioned relative to it, so the ladder, the
   * borders and the text ramp all follow — and the contrast floors on the text
   * re-solve against the new background rather than drifting.
   */
  surfaceMode?: SurfaceMode;
  /**
   * Global. Widens the usable chroma range by relaxing the sRGB-safe limit,
   * producing a softer, more even palette across hues. Glaze treats `pastel` as
   * instance-level, so it is threaded into every theme.
   *
   * It also **pins the accent's saturation to 100**: the even, hue-independent ceiling
   * is what pastel is for, and a second saturation scale on top of it would only undo
   * that. Two paths, then — pastel with no saturation knob, or `pastel: false` with a
   * free 0–100 one.
   *
   * Which is why a lone `accent: { saturation }` picks the second path for you. State
   * this field only to override that: it is the coarser of the two choices, so it wins
   * wherever both are set, and a saturation it shadows is ignored with a dev warning.
   *
   * The same ceiling is why a color seed cannot render exactly under pastel — `#FFD400`
   * softens to `#e4d8ad`. Under pastel a color contributes its hue and its tone; turn
   * pastel off to get its chroma too.
   *
   * Every theme except `code`. The syntax family is calibrated on its own saturation and
   * is deliberately left out — softening it collapses the chroma spread the syntax hues
   * rely on to stay apart. To soften a code block, lower
   * {@link PaletteCodeSeed.saturation} instead.
   */
  pastel?: boolean;
  /**
   * Global. `'auto'` (the default) leaves contrast entirely to the two-tier model:
   * normal colors plus a high-contrast tier driven by `<html data-contrast="high">`
   * / `prefers-contrast: more`.
   *
   * A number (0–100) additionally positions the **normal** colors on a slider, so
   * a product can offer its own contrast control. `0` is the shipped palette and
   * `100` is the high-contrast one, bit for bit.
   *
   * The two **compose** rather than replace each other: the high-contrast tier
   * stays the true high-contrast resolution at every level — identical to what
   * `'auto'` emits — so a slider raises the baseline while
   * `prefers-contrast: more` still escalates on top of it. The one exception is
   * `100`, where the normal colors already *are* the high-contrast ones and a
   * second tier would only duplicate them.
   */
  contrastLevel?: number | 'auto';
  /**
   * Per-theme seed overrides. Each status theme takes the same {@link PaletteSeed} the
   * accent zone does, and inherits the accent's saturation until it sets its own.
   *
   * **As numbers** — `{ hue, saturation }`. Status hues have to stay semantically
   * legible (danger red, warning amber, success green) and far enough apart from each
   * other and from the brand to read as different things.
   *
   * **As a color** — the theme's accent family becomes that color, on the same terms
   * {@link PaletteConfig.accent} sets: the light/normal-contrast variant reproduces it,
   * the softened APCA floors apply instead of the white-anchored ladder's WCAG ones, and
   * the tone is capped so the `#white` label every `type="primary"` item paints on the
   * fill survives.
   *
   * Here the color's chroma **does** become the theme's seed saturation, unlike the
   * accent's. Nothing inherits from a status theme, so there is nothing to
   * re-chromatize — and it is what keeps the theme's tinted banner surface, border and
   * text ramp at their shipped proportions to the fill instead of drifting relative to
   * it.
   */
  themes?: {
    success?: PaletteSeed;
    danger?: PaletteSeed;
    warning?: PaletteSeed;
    note?: PaletteSeed;
    code?: PaletteCodeSeed;
  };
}

/** {@link PaletteConfig} with every field resolved to a concrete value. */
export interface ResolvedPaletteConfig {
  hue: number;
  baseHue: number;
  saturation: number;
  baseSaturation: number;
  surfaceMode: SurfaceMode;
  /**
   * The accent color as given, handed to Glaze's `from` so the brand family renders
   * as that literal value rather than as a shade re-derived from the seed.
   *
   * `null` — the common case — means no accent color was supplied and the family keeps
   * its white-anchored derivation, which is the only arrangement that reproduces the
   * shipped palette bit for bit.
   */
  accentColor: string | null;
  /**
   * The base color as given, or `null`.
   *
   * Nothing renders from it — the hue and the saturation it derives are what reach the
   * palette. It is resolved anyway so {@link isSameConfig} can compare it, which is the
   * only way a write that changes the *string* without changing either derived number
   * still counts as a change. `MAX_BASE_SATURATION` makes that a live case rather than
   * a theoretical one: every color above the clip on a given hue derives the same pair,
   * so without this a color picker's whole upper range — and its entire tone axis, which
   * a base color discards — would drop writes silently and leave the field stale.
   */
  baseColor: string | null;
  /**
   * The tone of {@link ResolvedPaletteConfig.accentColor}, or `null` alongside it.
   *
   * `from` carries the tone itself, so this exists for the one thing that needs the
   * *number*: the hover brand text sits a fixed tone step past the rest one, and a
   * step has to be computed.
   */
  accentTone: number | null;
  /**
   * The saturation of {@link ResolvedPaletteConfig.accentColor}, or `null` beside it.
   *
   * On the palette's 0–100 scale, like every other saturation here — and deliberately
   * *not* the same number as {@link ResolvedPaletteConfig.saturation}, which a color
   * never raises. The accent family gets this chroma through Glaze's `from`, where it is
   * absolute; the seed stays where it was so the status themes that inherit it are left
   * alone.
   *
   * Kept as a number because the accent seed is rebuilt from its three components rather
   * than handed over as the literal: the tone is capped so a white label survives on the
   * fill, and a capped tone means reconstructing the color anyway.
   */
  accentSaturation: number | null;
  pastel: boolean;
  contrastLevel: number | 'auto';
  themes: {
    success: ResolvedThemeSeed;
    danger: ResolvedThemeSeed;
    warning: ResolvedThemeSeed;
    note: ResolvedThemeSeed;
    code: { saturation: number };
  };
}

/** One status theme's seed, resolved. */
export interface ResolvedThemeSeed {
  hue: number;
  /**
   * The theme's Glaze seed, and a ceiling on every color in it.
   *
   * On the numeric path this inherits the accent's saturation until the theme pins its
   * own. On the color path it **is** the color's chroma, which is what keeps the theme's
   * tinted surface, border and text ramp at their shipped proportions to a fill whose
   * chroma arrives absolute through `from`. See {@link PaletteConfig.themes} for why the
   * accent zone does the opposite.
   */
  saturation: number;
  /**
   * The color as given, handed to Glaze's `from` so this theme's accent family renders
   * as that literal value rather than as a shade re-derived from the seed.
   *
   * `null` — the common case — means the theme is on the numeric path and its accent
   * family keeps the white-anchored derivation, which is the only arrangement that
   * reproduces the shipped palette bit for bit.
   */
  color: string | null;
  /**
   * The tone of {@link ResolvedThemeSeed.color}, or `null` alongside it.
   *
   * `from` carries the tone itself, so this exists for the two things that need the
   * *number*: the hover brand text sits a fixed tone step past the rest one, and the
   * tone is capped so the `#white` label a `type="primary"` item paints on the fill
   * survives. Both are arithmetic, and neither can be done to a string.
   */
  colorTone: number | null;
}

// ============================================================================
// Resolution
// ============================================================================

const DEFAULT_THEME_HUES = {
  success: DEFAULT_SUCCESS_HUE,
  danger: DEFAULT_DANGER_HUE,
  warning: DEFAULT_WARNING_HUE,
  note: DEFAULT_NOTE_HUE,
} as const;

/**
 * Warned once per process, not once per call.
 *
 * `resolveConfig` runs on every write AND on every `resolvePaletteConfig` preview, so an
 * unguarded warning would fire on every frame of a slider drag.
 */
let warnedAboutPastelSaturation = false;

/**
 * One zone's seed, normalized to the four things a resolver can ask for.
 *
 * The single place a {@link PaletteSeed} is taken apart, so the six zones cannot drift
 * in how they read one. A string that {@link colorSeed} cannot parse comes back as the
 * numeric path with nothing pinned, which is exactly the fallback the docs promise: the
 * zone keeps its defaults rather than the render going down over a typo.
 */
function seedOf(seed: PaletteSeed | undefined): {
  color: string | null;
  hue: number | undefined;
  saturation: number | undefined;
  tone: number | null;
} {
  if (typeof seed === 'string') {
    const parsed = colorSeed(seed);

    return parsed
      ? {
          color: seed,
          hue: parsed.hue,
          saturation: parsed.saturation,
          tone: parsed.tone,
        }
      : { color: null, hue: undefined, saturation: undefined, tone: null };
  }

  return {
    color: null,
    hue: seed?.hue,
    saturation: seed?.saturation,
    tone: null,
  };
}

/**
 * Whether a zone pinned a saturation *as a number*.
 *
 * A color's chroma is not a pinned saturation — it reaches the palette through `from`,
 * not through the seed — so it must not answer the question `pastel` asks below.
 */
function pinnedSaturation(seed: PaletteSeed | undefined): number | undefined {
  return typeof seed === 'string' ? undefined : seed?.saturation;
}

function resolveConfig(input: PaletteConfig): ResolvedPaletteConfig {
  const themes = input.themes ?? {};

  const accent = seedOf(input.accent);
  const base = seedOf(input.base);

  // A numeric `saturation` with no `pastel` beside it turns pastel OFF.
  //
  // Under pastel there is one saturation and it is the top of the scale, so the two
  // fields cannot both be honoured — but writing a saturation is only ever a request to
  // tune it, which is the non-pastel path by definition. Reading it as one keeps
  // `setPaletteConfig({ accent: { saturation: 55 } })` doing what it always did.
  //
  // A COLOR does not answer this question. `accent: '#7a4dbf'` alone still resolves
  // pastel-on, so the color contributes its hue and its tone but not its chroma — the
  // documented behaviour, and the reason the tuner writes `pastel: false` explicitly
  // when it hands a zone a hex.
  //
  // An explicit `pastel` wins, both ways: it is the coarser choice of the two, and a
  // config that states it is choosing a color space rather than a value on one.
  const accentSaturationPin = pinnedSaturation(input.accent);
  const pastel = input.pastel ?? accentSaturationPin === undefined;

  // The zone's own seed, or the shipped default. There is no third arm to rank: the
  // paths are exclusive, so `accent.hue` is the color's on one and the written number on
  // the other, and never both.
  const hue = accent.hue ?? DEFAULT_HUE;

  // `base.tone` is never read — that is the whole enforcement of "a base color says
  // which way the greys lean and how far, not how dark they are". Its saturation
  // *is* read, below.
  const baseHue = base.hue ?? hue;

  // Only a CONTRADICTION warns — `pastel: true` written next to a saturation it will
  // ignore. The inference above means a lone saturation is not a contradiction, and a
  // saturation of exactly 100 is not one either: that is the value pastel pins it to.
  if (
    input.pastel === true &&
    accentSaturationPin !== undefined &&
    accentSaturationPin !== DEFAULT_SATURATION &&
    !warnedAboutPastelSaturation
  ) {
    warnedAboutPastelSaturation = true;
    console.warn(
      `[cube-ui-kit] palette \`accent.saturation\` (${accentSaturationPin}) is ignored ` +
        `because \`pastel\` is on — pastel pins it to ${DEFAULT_SATURATION}. Drop ` +
        `\`pastel\`, or set it to \`false\`, to tune saturation yourself.`,
    );
  }

  // Deliberately the numeric pin only, NOT `accent.saturation`: the accent family
  // carries a color's own chroma through Glaze's `from`, so the palette-level seed no
  // longer has to be raised to reach it. Leaving it alone is what keeps a saturated
  // brand out of every status theme, which all inherit this number.
  //
  // The neutral chrome is the one exception, and it is deliberate — `baseSaturation`
  // below takes its share of the accent's own chroma so a near-grey brand leaves
  // near-grey chrome. That is scoped to the base zone and capped by this seed; it does
  // not pass through here.
  //
  // A status theme's color is the mirror image, and for the mirror reason: nothing
  // inherits from a status theme, so its chroma DOES become its seed. See
  // {@link ResolvedThemeSeed.saturation}.
  const saturation = pastel
    ? DEFAULT_SATURATION
    : accentSaturationPin ?? DEFAULT_SATURATION;

  return {
    hue,
    baseHue,
    saturation,
    // Three arms, and the middle two are on deliberately different scales.
    //
    // A named base COLOR means "the chrome IS this color", so it lands near it, clipped
    // at `MAX_BASE_SATURATION`. Base merely FOLLOWING the accent means "a faint tint of
    // the brand", so it stays the 12% share it has always been — now of the accent's own
    // chroma, whether that arrived as a number or as a color. Reading `accent.saturation`
    // here is the one place a brand color reaches the base zone, and it has to: without
    // it, picking a near-grey brand would leave the chrome carrying 12% of a saturation
    // nobody asked for.
    //
    // BOTH derived arms are also capped by `saturation`, and that is load-bearing rather
    // than defensive. `baseSaturationScale` divides by the seed, so the chrome's absolute
    // chroma is a function of this field ALONE — without the cap, an accent color would
    // cancel the seed out of the base zone entirely and a muted `saturation: 20` would
    // leave the chrome 4.4x more chromatic than asked for. The seed is a ceiling
    // everywhere else in the palette; it is one here too.
    //
    // A numeric pin is NOT clipped: a number is the more specific instruction, and a
    // tuner that offers the range is entitled to the top of it.
    //
    // Nothing here reaches the status themes, which is what keeps the guarantee that an
    // accent color cannot re-chromatize them.
    //
    // The accent arm sits INSIDE the parentheses on purpose: hoisting it to
    // `accent.saturation ?? saturation * SHARE` would apply the share to only one of the
    // two and move the shipped default.
    baseSaturation:
      pinnedSaturation(input.base) ??
      (base.color
        ? Math.min(base.saturation!, MAX_BASE_SATURATION, saturation)
        : Math.min(accent.saturation ?? saturation, saturation) *
          SURFACE_SATURATION_SHARE),
    surfaceMode: input.surfaceMode ?? 'neutral',
    accentColor: accent.color,
    baseColor: base.color,
    accentTone: accent.tone,
    accentSaturation: accent.color === null ? null : accent.saturation!,
    pastel,
    contrastLevel: input.contrastLevel ?? 'auto',
    themes: {
      success: resolveThemeSeed('success', themes.success, saturation),
      danger: resolveThemeSeed('danger', themes.danger, saturation),
      warning: resolveThemeSeed('warning', themes.warning, saturation),
      note: resolveThemeSeed('note', themes.note, saturation),
      // Deliberately NOT `?? saturation`: the code palette is calibrated once and
      // does not follow the palette-level seed. See `PaletteCodeSeed`.
      code: { saturation: themes.code?.saturation ?? DEFAULT_CODE_SATURATION },
    },
  };
}

/**
 * One status theme's seed, on whichever path it is on.
 *
 * The color arm takes all three of the color's components — hue, chroma and tone — where
 * the accent zone deliberately leaves the chroma out of its seed. The asymmetry is the
 * point: this seed is inherited by nothing, so raising it re-chromatizes nothing, and
 * raising it is what holds the theme's tinted surface, border and text ramp in the same
 * proportion to the fill that the shipped derivation gives them.
 */
function resolveThemeSeed(
  name: keyof typeof DEFAULT_THEME_HUES,
  seed: PaletteSeed | undefined,
  saturation: number,
): ResolvedThemeSeed {
  const parsed = seedOf(seed);

  if (parsed.color !== null) {
    return {
      hue: parsed.hue!,
      saturation: parsed.saturation!,
      color: parsed.color,
      colorTone: parsed.tone,
    };
  }

  return {
    hue: parsed.hue ?? DEFAULT_THEME_HUES[name],
    saturation: parsed.saturation ?? saturation,
    color: null,
    colorTone: null,
  };
}

/**
 * The palette as it ships, with no tuning applied. Frozen — it is the baseline
 * every resolution falls back to, so a stray write to it would move the defaults
 * for the whole process.
 */
export const DEFAULT_PALETTE_CONFIG: ResolvedPaletteConfig = freezeConfig(
  resolveConfig({}),
);

// ============================================================================
// Store
// ============================================================================

/**
 * The last config *as written*, sparse — not the resolved one. Keeping the sparse
 * form is what makes inheritance live: a `saturation` with no `themes.danger.
 * saturation` beside it means danger genuinely follows the palette, rather than
 * having been frozen at whatever the palette read when it was set.
 */
let input: PaletteConfig = {};
let resolved: ResolvedPaletteConfig = DEFAULT_PALETTE_CONFIG;
let version = 0;

const listeners = new Set<() => void>();

function mergeSeed(
  base: PaletteSeed | undefined,
  patch: PaletteSeed | undefined,
): PaletteSeed | undefined {
  // A patch that omits the zone entirely says nothing about it, so the base survives.
  // Clearing one of its fields is `{ zone: { hue: undefined } }`.
  if (patch === undefined) return base;
  if (base === undefined) return patch;

  // Either side being a color makes this a change of PATH, not of value, and a path is
  // replaced rather than merged — spreading a hex into an object is meaningless in one
  // direction and would resurrect a discarded color in the other. Layering is a
  // within-path operation, which is the whole reason `PaletteSeed` is a union.
  if (typeof base === 'string' || typeof patch === 'string') return patch;

  return { ...base, ...patch };
}

/** {@link mergeSeed} for the code seed, which is not a {@link PaletteSeed}. */
function mergeCodeSeed(
  base: PaletteCodeSeed | undefined,
  patch: PaletteCodeSeed | undefined,
): PaletteCodeSeed | undefined {
  if (!base) return patch;
  if (!patch) return base;

  return { ...base, ...patch };
}

/**
 * Layer a patch over a base config. Used by {@link resolvePaletteConfig} for
 * previews — *not* by {@link setPaletteConfig}, which replaces.
 */
function mergeInput(base: PaletteConfig, patch: PaletteConfig): PaletteConfig {
  const next: PaletteConfig = {
    ...base,
    ...patch,
    // Spread alone would replace a zone's whole seed, so a preview of
    // `{ accent: { hue: 30 } }` over a pinned saturation would silently drop it.
    ...(base.accent !== undefined || patch.accent !== undefined
      ? { accent: mergeSeed(base.accent, patch.accent) }
      : null),
    ...(base.base !== undefined || patch.base !== undefined
      ? { base: mergeSeed(base.base, patch.base) }
      : null),
  };

  if (base.themes || patch.themes) {
    next.themes = {
      success: mergeSeed(base.themes?.success, patch.themes?.success),
      danger: mergeSeed(base.themes?.danger, patch.themes?.danger),
      warning: mergeSeed(base.themes?.warning, patch.themes?.warning),
      note: mergeSeed(base.themes?.note, patch.themes?.note),
      code: mergeCodeSeed(base.themes?.code, patch.themes?.code),
    };
  }

  return next;
}

function isSameConfig(a: ResolvedPaletteConfig, b: ResolvedPaletteConfig) {
  return (
    a.hue === b.hue &&
    a.baseHue === b.baseHue &&
    a.saturation === b.saturation &&
    a.baseSaturation === b.baseSaturation &&
    a.surfaceMode === b.surfaceMode &&
    // The colors themselves, not just what they derived: a color's chroma no longer
    // reaches `saturation` (the family gets it through Glaze's `from`), so two brands can
    // agree on every numeric seed and still render differently. And a base color's
    // derived pair collapses — everything above `MAX_BASE_SATURATION` on one hue lands
    // on the same two numbers, and its tone is discarded outright — so comparing the
    // string is the only thing that lets a color picker's upper range and tone axis
    // register at all.
    a.accentColor === b.accentColor &&
    a.baseColor === b.baseColor &&
    a.pastel === b.pastel &&
    a.contrastLevel === b.contrastLevel &&
    a.themes.code.saturation === b.themes.code.saturation &&
    (['success', 'danger', 'warning', 'note'] as const).every(
      (name) =>
        a.themes[name].hue === b.themes[name].hue &&
        a.themes[name].saturation === b.themes[name].saturation &&
        // A status color's hue and chroma DO land in the two numbers above, so this
        // catches only what they cannot: the tone, and one unparseable string replacing
        // another.
        a.themes[name].color === b.themes[name].color,
    )
  );
}

/**
 * Which fields are *explicitly set*, as an order-independent signature.
 *
 * Two configs can resolve to identical values yet differ in which of those values
 * are pinned rather than inherited — pinning a status theme's saturation to the number
 * it already inherited is the obvious case. That difference is invisible to
 * {@link isSameConfig} but visible through {@link getPaletteConfigInput}, so it has
 * to count as a change or a settings UI reading it would never re-render.
 */
function pinSignature(config: PaletteConfig): string {
  const set = (value: unknown) => (value === undefined ? '0' : '1');

  /**
   * One zone, in three states — absent, numbers, or a color.
   *
   * **Absent is its own state**, not "numbers with nothing pinned". `base: {}` and no
   * `base` at all resolve identically, but they read back differently, and a settings UI
   * asks exactly that question to decide whether the chrome has a seed of its own or is
   * still following the accent.
   *
   * A color carries its **value**, not just its presence. Presence alone cannot tell one
   * unparseable string from another: both resolve to `null`, so `isSameConfig` sees no
   * movement either, and replacing `'bad-one'` with `'bad-two'` returned early — leaving
   * the field on the first string with no notification that the write was dropped.
   *
   * It also means two spellings of the same color (`'#ff0000'` / `'rgb(255 0 0)'`) bump
   * the version. That is the same argument the presence check was already making: what a
   * settings UI reads back changed, so it has to re-render. And a zone switching from
   * `{ hue: 45 }` to a color that happens to derive hue 45 resolves to the same numbers,
   * so without this the version would never bump and the control would look stuck.
   */
  const seed = (value: PaletteSeed | undefined) =>
    value === undefined
      ? '-'
      : typeof value === 'string'
        ? JSON.stringify(value)
        : `${set(value.hue)}${set(value.saturation)}`;

  return [
    seed(config.accent),
    seed(config.base),
    set(config.surfaceMode),
    set(config.pastel),
    set(config.contrastLevel),
    set(config.themes?.code?.saturation),
    ...(['success', 'danger', 'warning', 'note'] as const).map((name) =>
      seed(config.themes?.[name]),
    ),
  ].join('|');
}

/**
 * Snapshot a config so the store owns it outright.
 *
 * Two hazards this closes. The caller's object stays theirs, so mutating it after
 * the call cannot desync `input` from `resolved`. And what we hand back from
 * {@link getPaletteConfig} / {@link getPaletteConfigInput} is frozen, so a caller
 * who writes to it gets a clear failure rather than silently corrupting the store
 * — the version would not bump, and every token cache would go on serving values
 * that no longer match the config.
 */
function freezeConfig<T extends PaletteConfig | ResolvedPaletteConfig>(
  config: T,
): T {
  const themes = config.themes;

  if (themes) {
    // A string seed is already immutable, and `Object.freeze` on one is a no-op that
    // TypeScript would rather we did not ask for.
    for (const seed of Object.values(themes)) {
      if (seed && typeof seed === 'object') Object.freeze(seed);
    }
    Object.freeze(themes);
  }

  // Only the sparse INPUT carries zone seeds; the resolved config is flat, so this half
  // is a no-op for it rather than a branch either caller has to know about.
  const zones = config as Partial<PaletteConfig>;

  if (typeof zones.accent === 'object') Object.freeze(zones.accent);
  if (typeof zones.base === 'object') Object.freeze(zones.base);

  return Object.freeze(config);
}

/** {@link freezeConfig} on a copy, for a config we did not create ourselves. */
function snapshotConfig(config: PaletteConfig): PaletteConfig {
  const themes = config.themes;
  // Copy the object arm; a string is already a value.
  const copy = (seed: PaletteSeed | undefined) =>
    typeof seed === 'object' ? { ...seed } : seed;

  return freezeConfig({
    ...config,
    ...(config.accent !== undefined ? { accent: copy(config.accent) } : null),
    ...(config.base !== undefined ? { base: copy(config.base) } : null),
    ...(themes
      ? {
          themes: {
            ...(themes.success !== undefined
              ? { success: copy(themes.success) }
              : null),
            ...(themes.danger !== undefined
              ? { danger: copy(themes.danger) }
              : null),
            ...(themes.warning !== undefined
              ? { warning: copy(themes.warning) }
              : null),
            ...(themes.note !== undefined ? { note: copy(themes.note) } : null),
            ...(themes.code ? { code: { ...themes.code } } : null),
          },
        }
      : null),
  });
}

function commit(nextInput: PaletteConfig) {
  const nextResolved = resolveConfig(nextInput);

  // Bail before bumping the version when nothing observable moved, so re-applying
  // the same config — an inline `<Root palette={{ … }}>` literal on every
  // render, a StrictMode double render — costs nothing.
  if (
    isSameConfig(resolved, nextResolved) &&
    pinSignature(input) === pinSignature(nextInput)
  ) {
    return;
  }

  input = snapshotConfig(nextInput);
  resolved = freezeConfig(nextResolved);
  version++;

  listeners.forEach((listener) => listener());
}

/**
 * Set the palette config.
 *
 * **Replaces**, like `useState` — the config you pass *is* the config, resolved
 * against the shipped defaults. Nothing accumulates, so a field you leave out is a
 * field you do not have: dropping a customization means dropping it from the
 * object, and re-applying the same object twice is the same as applying it once.
 *
 * ```ts
 * setPaletteConfig({ accent: { hue: 200 }, base: { hue: 60 } });
 * setPaletteConfig({ accent: { hue: 200 } }); // `base` is gone — follows accent again
 * ```
 *
 * To adjust one field of the config already in place — a slider in a settings UI —
 * pass an updater. It receives the config as written, sparse, so spreading it
 * preserves which fields are pinned and which still inherit:
 *
 * ```ts
 * setPaletteConfig((config) => ({ ...config, accent: { hue: 200 } }));
 * ```
 *
 * The palette is rebuilt lazily on the next token read, and any mounted `<Root>`
 * re-injects the token block — no component re-render is involved, because every
 * color in the kit resolves through a CSS custom property.
 */
export function setPaletteConfig(
  config: PaletteConfig | ((previous: PaletteConfig) => PaletteConfig),
): void {
  commit(typeof config === 'function' ? config(input) : config);
}

/**
 * Drop all tuning and restore the palette the kit ships with. Identical to
 * `setPaletteConfig({})`; it exists to be readable at a call site.
 */
export function resetPaletteConfig(): void {
  commit({});
}

/**
 * Force every token to re-resolve without changing the palette config.
 *
 * Only needed if you drive Glaze directly — `glaze.configure({ darkTone })` and
 * the like. Glaze invalidates its own caches, but the kit's token maps are
 * memoized against *this* module's version, so they need telling. Calling it
 * before the first paint is unnecessary; nothing has been resolved yet.
 */
export function invalidatePaletteTokens(): void {
  version++;
  listeners.forEach((listener) => listener());
}

/** The current config, with every field resolved to a concrete value. */
export function getPaletteConfig(): ResolvedPaletteConfig {
  return resolved;
}

/**
 * The config **as set**, sparse — omitted fields are the ones still inheriting.
 *
 * {@link getPaletteConfig} resolves everything to concrete values, which loses the
 * distinction between "explicitly 80" and "80 because it follows the brand". A
 * settings UI needs that distinction to show an inherited value as inherited, and
 * to offer a way back:
 *
 * ```ts
 * const own = getPaletteConfigInput().base !== undefined;
 *
 * // Re-link it to the brand by dropping the field.
 * setPaletteConfig(({ base, ...config }) => config);
 * ```
 *
 * It is also the value handed to a {@link setPaletteConfig} updater.
 */
export function getPaletteConfigInput(): PaletteConfig {
  return input;
}

/**
 * Resolve a patch **over** the current config, without applying it.
 *
 * This one layers, unlike {@link setPaletteConfig}: a preview wants "the theme in
 * use, but in dark", so the fields it does not mention have to come from the live
 * config rather than from the defaults. The store is not touched and no listener
 * fires.
 */
export function resolvePaletteConfig(
  config?: PaletteConfig,
): ResolvedPaletteConfig {
  if (!config) return resolved;

  return resolveConfig(mergeInput(input, config));
}

/**
 * Increments whenever the resolved config changes. The token caches in
 * `./palette.ts`, `./colors.ts` and `./index.ts` compare against it instead of
 * memoizing forever — the same idiom Glaze uses for its own config version.
 */
export function getPaletteVersion(): number {
  return version;
}

/** Subscribe to palette config changes. Returns an unsubscribe function. */
export function subscribePaletteConfig(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// ============================================================================
// React bindings
// ============================================================================

/**
 * Re-render on palette config changes. Returns the version, not the config, so
 * the snapshot is a primitive and React never warns about an uncached snapshot.
 */
export function usePaletteVersion(): number {
  return useSyncExternalStore(
    subscribePaletteConfig,
    getPaletteVersion,
    getPaletteVersion,
  );
}

/**
 * Read and tune the palette from React, `useState`-style — including the part
 * where the setter *replaces*. A control that changes one field wants the updater
 * form, or it will drop every other field:
 *
 * ```tsx
 * const [palette, setPalette] = usePaletteConfig();
 *
 * <HueSlider
 *   value={palette.hue}
 *   onChange={(hue) => setPalette((config) => ({ ...config, accent: { hue } }))}
 * />
 * ```
 *
 * The first element is the *resolved* config, so `palette.hue` is always a number — it
 * keeps the flat shape the recipe reads, whichever way the zones were seeded. The
 * updater's argument is the sparse one — see {@link getPaletteConfigInput}.
 *
 * The config is global process state, so every consumer of this hook — and every
 * mounted `<Root>` — sees the same palette.
 */
export function usePaletteConfig(): readonly [
  ResolvedPaletteConfig,
  typeof setPaletteConfig,
] {
  usePaletteVersion();

  return [getPaletteConfig(), setPaletteConfig];
}
