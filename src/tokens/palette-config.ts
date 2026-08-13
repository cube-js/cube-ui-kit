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

/** Hue / saturation seed override for one colored theme. */
export interface PaletteThemeSeed {
  /** Hue in degrees (0–360). */
  hue?: number;
  /** Saturation (0–100). Defaults to the palette-level `saturation`. */
  saturation?: number;
}

/**
 * The `code-*` syntax family takes a saturation and nothing else — and answers to
 * nothing else either. This is the one knob that moves it.
 *
 * Its hues are absolute literals by design, so syntax colors never rotate with the
 * brand — strings would collide with numbers the moment the brand went green. Unlike
 * every other theme, its saturation does **not** inherit the palette-level one: the
 * code palette is calibrated once and stays there, so re-seeding the app cannot
 * quietly wash out a code block. {@link PaletteConfig.pastel} skips it for the same
 * reason.
 */
export interface PaletteCodeSeed {
  /** Saturation (0–100). Defaults to {@link DEFAULT_CODE_SATURATION}, not to `saturation`. */
  saturation?: number;
}

/** Names of the themes whose seeds can be overridden individually. */
export type PaletteThemeName =
  | 'success'
  | 'danger'
  | 'warning'
  | 'note'
  | 'code';

/**
 * Palette tuning. Every field is optional; omitted fields keep their default,
 * and per-theme fields left unset inherit the palette-level value.
 */
export interface PaletteConfig {
  /**
   * Accent zone seeded by a **color** rather than a hue — the brand, as you have it.
   *
   * Anything Glaze parses: hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()`, `oklch()`.
   * CSS color keywords (`rebeccapurple`) are not supported. An unparseable value
   * warns and falls back to the numeric seed.
   *
   * Unlike {@link ColorThemeConfig.hue}, which keeps only hue and saturation, this
   * keeps the **tone** as well — which is the whole point. Without it the brand fill
   * is authored as a fixed tone step off white, so every accent hue lands at roughly
   * the same lightness and the color you asked for never actually appears.
   *
   * The color is rendered exactly wherever a 3:1 floor against `surface` allows, and
   * moved only as far as that floor requires. Two things cost exactness:
   * {@link PaletteConfig.pastel} caps chroma (so `#FFD400` softens to `#e4d8ad`),
   * and a light color on a light page has to darken to stay distinguishable.
   *
   * {@link PaletteConfig.hue} and {@link PaletteConfig.saturation} still win when
   * set — the number is the more specific instruction — and the tone keeps coming
   * from here either way, so a preview can rotate the hue without losing the brand's
   * lightness.
   */
  accentColor?: string;
  /**
   * Base zone seeded by a **color** rather than a hue.
   *
   * Only its **hue** is read; its tone and saturation are discarded, because the
   * chrome's lightness ladder and its 0.10–0.20 saturation factors are the design —
   * a base color says which way the greys lean, not how dark or how vivid they are.
   *
   * {@link PaletteConfig.baseHue} wins when set.
   */
  baseColor?: string;
  /**
   * Accent hue in degrees (0–360) — the brand.
   *
   * Drives the `accent-*` family on every theme, `primary` / `purple` / `special`,
   * and the brand-tinted odds and ends (`focus`, the loading faces, the disabled
   * chip). Also the default for {@link PaletteConfig.baseHue}.
   */
  hue?: number;
  /**
   * Hue of the **base** zone in degrees (0–360): the neutral chrome — `surface`
   * and its ladder, the `surface-text*` ramp, `border`, `placeholder`. Defaults to
   * `hue`, so the chrome carries a faint tint of the brand unless you say otherwise.
   *
   * Splitting it lets the chrome sit on a different hue from the accent — a warm
   * grey UI with a cool blue brand, say. Only the `default` theme is affected: a
   * colored theme's tinted `surface` deliberately follows *its own* hue, because a
   * danger banner should read as red.
   */
  baseHue?: number;
  /**
   * Seed saturation (0–100), and the fallback for every theme that does not set
   * its own.
   *
   * **Belongs to the non-pastel path**, and setting it says so: with no
   * {@link PaletteConfig.pastel} beside it, this turns pastel off, because tuning a
   * saturation is the non-pastel path by definition. Pastel is one flat chroma ceiling,
   * so under it there is exactly one seed and it is the top of the scale.
   *
   * A `pastel: true` written next to a saturation wins and the saturation is ignored
   * (with a dev warning) — but it is kept rather than dropped, so turning pastel back
   * off restores your number.
   *
   * One scale for the whole theme, by design. Every color's own `saturation` is a
   * 0–1 factor of this seed — `surface` at 0.12, `border` at 0.175, the text ramp
   * at 0.2, the accent family at ~1.0 — so moving it rescales the palette while
   * keeping those proportions. Unlike hue, which is configured separately for the
   * brand and for each status theme, saturation is deliberately not split: the
   * ratio between a subtle surface tint and a saturated accent is part of the
   * design.
   */
  saturation?: number;
  /**
   * Global. Widens the usable chroma range by relaxing the sRGB-safe limit,
   * producing a softer, more even palette across hues. Glaze treats `pastel` as
   * instance-level, so it is threaded into every theme.
   *
   * It also **pins {@link PaletteConfig.saturation} to 100**: the even, hue-independent
   * ceiling is what pastel is for, and a second saturation scale on top of it would
   * only undo that. Two paths, then — pastel with no saturation knob, or
   * `pastel: false` with a free 0–100 one.
   *
   * Which is why a lone `saturation` picks the second path for you. State this field
   * only to override that: it is the coarser of the two choices, so it wins wherever
   * both are set, and a saturation it shadows is ignored with a dev warning.
   *
   * The same ceiling is why an {@link PaletteConfig.accentColor} cannot render
   * exactly under pastel — `#FFD400` softens to `#e4d8ad`. Under pastel a color
   * contributes its hue and its tone; turn pastel off to get its chroma too.
   *
   * Every theme except `code`. The syntax family is calibrated on its own
   * saturation and is deliberately left out — softening it collapses the chroma
   * spread the syntax hues rely on to stay apart. To soften a code block, lower
   * {@link PaletteCodeSeed.saturation} instead.
   */
  pastel?: boolean;
  /**
   * Global. `'auto'` (the default) keeps the two-tier model: normal colors plus
   * a separate high-contrast tier driven by `<html data-contrast="high">` /
   * `prefers-contrast: more`.
   *
   * A number (0–100) replaces that switch with a slider — and, because a manual
   * level already carries the contrast preference, **drops the high-contrast
   * tier entirely**. `0` reproduces the normal output and `100` the
   * high-contrast output, bit for bit.
   */
  contrastLevel?: number | 'auto';
  /** Per-theme seed overrides. */
  themes?: {
    success?: PaletteThemeSeed;
    danger?: PaletteThemeSeed;
    warning?: PaletteThemeSeed;
    note?: PaletteThemeSeed;
    code?: PaletteCodeSeed;
  };
}

/** {@link PaletteConfig} with every field resolved to a concrete value. */
export interface ResolvedPaletteConfig {
  hue: number;
  baseHue: number;
  saturation: number;
  /**
   * Tone (0–100, OKHST) the brand fill is pinned to, read off
   * {@link PaletteConfig.accentColor}.
   *
   * `null` — the common case — means no accent color was given and the fill keeps its
   * white-anchored derivation, which is the only arrangement that reproduces the
   * shipped palette bit for bit.
   */
  accentTone: number | null;
  pastel: boolean;
  contrastLevel: number | 'auto';
  themes: {
    success: { hue: number; saturation: number };
    danger: { hue: number; saturation: number };
    warning: { hue: number; saturation: number };
    note: { hue: number; saturation: number };
    code: { saturation: number };
  };
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

function resolveConfig(input: PaletteConfig): ResolvedPaletteConfig {
  const themes = input.themes ?? {};

  const accent = input.accentColor ? colorSeed(input.accentColor) : null;
  const base = input.baseColor ? colorSeed(input.baseColor) : null;

  // A `saturation` with no `pastel` beside it turns pastel OFF.
  //
  // Under pastel there is one saturation and it is the top of the scale, so the two
  // fields cannot both be honoured — but writing a saturation is only ever a request to
  // tune it, which is the non-pastel path by definition. Reading it as one keeps
  // `setPaletteConfig({ saturation: 55 })` doing what it always did.
  //
  // An explicit `pastel` wins, both ways: it is the coarser choice of the two, and a
  // config that states it is choosing a color space rather than a value on one.
  const pastel = input.pastel ?? input.saturation === undefined;

  // Explicit number > derived from a color > shipped default, for both zones. The
  // number is the more specific instruction, and keeping it ahead of the color is
  // what lets `resolvePaletteConfig({ hue: 30 })` rotate a stored `accentColor`
  // without discarding its tone.
  const hue = input.hue ?? accent?.hue ?? DEFAULT_HUE;

  // `base.tone` and `base.saturation` are never read — that is the whole enforcement
  // of "a base color contributes its hue and nothing else".
  const baseHue = input.baseHue ?? base?.hue ?? hue;

  // Only a CONTRADICTION warns — `pastel: true` written next to a saturation it will
  // ignore. The inference above means a lone `saturation` is not a contradiction, and a
  // saturation of exactly 100 is not one either: that is the value pastel pins it to.
  if (
    input.pastel === true &&
    input.saturation !== undefined &&
    input.saturation !== DEFAULT_SATURATION &&
    !warnedAboutPastelSaturation
  ) {
    warnedAboutPastelSaturation = true;
    console.warn(
      `[cube-ui-kit] palette \`saturation\` (${input.saturation}) is ignored because ` +
        `\`pastel\` is on — pastel pins it to ${DEFAULT_SATURATION}. Drop \`pastel\`, ` +
        `or set it to \`false\`, to tune saturation yourself.`,
    );
  }

  const saturation = pastel
    ? DEFAULT_SATURATION
    : input.saturation ?? accent?.saturation ?? DEFAULT_SATURATION;

  return {
    hue,
    baseHue,
    saturation,
    accentTone: accent?.tone ?? null,
    pastel,
    contrastLevel: input.contrastLevel ?? 'auto',
    themes: {
      success: {
        hue: themes.success?.hue ?? DEFAULT_THEME_HUES.success,
        saturation: themes.success?.saturation ?? saturation,
      },
      danger: {
        hue: themes.danger?.hue ?? DEFAULT_THEME_HUES.danger,
        saturation: themes.danger?.saturation ?? saturation,
      },
      warning: {
        hue: themes.warning?.hue ?? DEFAULT_THEME_HUES.warning,
        saturation: themes.warning?.saturation ?? saturation,
      },
      note: {
        hue: themes.note?.hue ?? DEFAULT_THEME_HUES.note,
        saturation: themes.note?.saturation ?? saturation,
      },
      // Deliberately NOT `?? saturation`: the code palette is calibrated once and
      // does not follow the palette-level seed. See `PaletteCodeSeed`.
      code: { saturation: themes.code?.saturation ?? DEFAULT_CODE_SATURATION },
    },
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

function mergeSeed<T extends PaletteThemeSeed | PaletteCodeSeed>(
  base: T | undefined,
  patch: T | undefined,
): T | undefined {
  if (!base) return patch;
  // A patch that omits the theme entirely says nothing about it, so the base
  // survives. Clearing one of its fields is `{ theme: { hue: undefined } }`.
  if (!patch) return base;

  return { ...base, ...patch };
}

/**
 * Layer a patch over a base config. Used by {@link resolvePaletteConfig} for
 * previews — *not* by {@link setPaletteConfig}, which replaces.
 */
function mergeInput(base: PaletteConfig, patch: PaletteConfig): PaletteConfig {
  const next: PaletteConfig = { ...base, ...patch };

  if (base.themes || patch.themes) {
    next.themes = {
      success: mergeSeed(base.themes?.success, patch.themes?.success),
      danger: mergeSeed(base.themes?.danger, patch.themes?.danger),
      warning: mergeSeed(base.themes?.warning, patch.themes?.warning),
      note: mergeSeed(base.themes?.note, patch.themes?.note),
      code: mergeSeed(base.themes?.code, patch.themes?.code),
    };
  }

  return next;
}

function isSameConfig(a: ResolvedPaletteConfig, b: ResolvedPaletteConfig) {
  return (
    a.hue === b.hue &&
    a.baseHue === b.baseHue &&
    a.saturation === b.saturation &&
    // `hue` and `saturation` already carry whatever an accent color derived, so tone
    // is the one reading they cannot discriminate: two colors can agree on both and
    // still be a different lightness of the brand.
    a.accentTone === b.accentTone &&
    a.pastel === b.pastel &&
    a.contrastLevel === b.contrastLevel &&
    a.themes.code.saturation === b.themes.code.saturation &&
    (['success', 'danger', 'warning', 'note'] as const).every(
      (name) =>
        a.themes[name].hue === b.themes[name].hue &&
        a.themes[name].saturation === b.themes[name].saturation,
    )
  );
}

/**
 * Which fields are *explicitly set*, as an order-independent signature.
 *
 * Two configs can resolve to identical values yet differ in which of those values
 * are pinned rather than inherited — pinning `primary.saturation` to the number it
 * already inherited is the obvious case. That difference is invisible to
 * {@link isSameConfig} but visible through {@link getPaletteConfigInput}, so it has
 * to count as a change or a settings UI reading it would never re-render.
 */
function pinSignature(config: PaletteConfig): string {
  const set = (value: unknown) => (value === undefined ? '0' : '1');

  return [
    // Both color seeds count, and they have to: a UI switching `{ hue: 45 }` for an
    // `accentColor` that happens to derive hue 45 resolves to the same numbers, so
    // without these the version would never bump and the control would look stuck.
    set(config.accentColor),
    set(config.baseColor),
    set(config.hue),
    set(config.baseHue),
    set(config.saturation),
    set(config.pastel),
    set(config.contrastLevel),
    set(config.themes?.code?.saturation),
    ...(['success', 'danger', 'warning', 'note'] as const).flatMap((name) => [
      set(config.themes?.[name]?.hue),
      set(config.themes?.[name]?.saturation),
    ]),
  ].join('');
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
    for (const seed of Object.values(themes)) {
      if (seed) Object.freeze(seed);
    }
    Object.freeze(themes);
  }

  return Object.freeze(config);
}

/** {@link freezeConfig} on a copy, for a config we did not create ourselves. */
function snapshotConfig(config: PaletteConfig): PaletteConfig {
  const themes = config.themes;

  return freezeConfig({
    ...config,
    ...(themes
      ? {
          themes: {
            ...(themes.success ? { success: { ...themes.success } } : null),
            ...(themes.danger ? { danger: { ...themes.danger } } : null),
            ...(themes.warning ? { warning: { ...themes.warning } } : null),
            ...(themes.note ? { note: { ...themes.note } } : null),
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
 * setPaletteConfig({ hue: 200, baseHue: 60 });
 * setPaletteConfig({ hue: 200 }); // baseHue is gone — back to inheriting `hue`
 * ```
 *
 * To adjust one field of the config already in place — a slider in a settings UI —
 * pass an updater. It receives the config as written, sparse, so spreading it
 * preserves which fields are pinned and which still inherit:
 *
 * ```ts
 * setPaletteConfig((config) => ({ ...config, hue: 200 }));
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
 * const pinned = getPaletteConfigInput().baseHue !== undefined;
 *
 * // Re-link it to the brand by dropping the field.
 * setPaletteConfig(({ baseHue, ...config }) => config);
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
 *   onChange={(hue) => setPalette((config) => ({ ...config, hue }))}
 * />
 * ```
 *
 * The first element is the *resolved* config, so `palette.hue` is always a number.
 * The updater's argument is the sparse one — see {@link getPaletteConfigInput}.
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
