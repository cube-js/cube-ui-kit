import {
  contrastRatioFromLuminance,
  glaze,
  okhslToLinearSrgb,
  okhslToOkhst,
  okhslToSrgb,
  relativeLuminanceFromLinearRgb,
  srgbToHex,
  variantToOkhsl,
} from '@tenphi/glaze';

import { colorSeed } from './color-seed';
import { getColorTokens, renderColorTokens } from './colors';
import {
  getCodeTheme,
  getPalette,
  getPaletteTokens,
  renderPaletteTokens,
} from './palette';
import {
  DEFAULT_CODE_SATURATION,
  DEFAULT_PALETTE_CONFIG,
  getPaletteConfig,
  getPaletteConfigInput,
  getPaletteVersion,
  invalidatePaletteTokens,
  resetPaletteConfig,
  setPaletteConfig,
  subscribePaletteConfig,
} from './palette-config';

import type { Styles, Tokens } from '@tenphi/tasty';
import type { PaletteConfig } from './palette-config';

type TokenStates = Record<string, string>;

const CODE_TOKENS = [
  '#code-comment',
  '#code-punctuation',
  '#code-keyword',
  '#code-string',
  '#code-number',
  '#code-function',
  '#code-attribute',
];

/**
 * Flatten the tasty token map into a stable, diffable string map.
 *
 * `getPaletteTokens()` returns `{ '#surface': { '': '…', '@dark': '…', '@hc': '…',
 * '@dark & @hc': '…' } }`. Token keys and state keys are both sorted so the
 * snapshot is insensitive to declaration order — a reordered `colors()` call is
 * not a palette change, and should not read as one in review.
 */
function dumpTokens(tokens: Styles): Record<string, string> {
  const out: Record<string, string> = {};

  for (const name of Object.keys(tokens).sort()) {
    const value = tokens[name] as TokenStates;

    out[name] = Object.keys(value)
      .sort()
      .map((state) => `${state || '(base)'}=${value[state]}`)
      .join(' | ');
  }

  return out;
}

/** Pick one scheme variant out of every token's state map. */
function variant(tokens: Styles, state: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const name of Object.keys(tokens).sort()) {
    const value = (tokens[name] as TokenStates)[state];

    if (value !== undefined) out[name] = value;
  }

  return out;
}

/**
 * Pull the hue out of every state of one token.
 *
 * Values are `oklch(L C H)`, so the third component is the hue. Useful for
 * asserting a token's *hue* is pinned while allowing its lightness / chroma to
 * move — a token anchored to `surface` with a contrast floor legitimately
 * re-solves when the surface's tint changes.
 */
function huesOf(tokens: Styles, name: string): string[] {
  return Object.values(tokens[name] as TokenStates).map(
    (value) => value.trim().split(/\s+/)[2]?.replace(')', '') ?? value,
  );
}

function statesOf(tokens: Styles): string[] {
  const states = new Set<string>();

  for (const value of Object.values(tokens)) {
    for (const state of Object.keys(value as TokenStates)) states.add(state);
  }

  return [...states].sort();
}

/**
 * An emitted `oklch(…)` token value, back as a hex string.
 *
 * The palette emits absolute colors, so this reads them at face value —
 * `pastel: false` on the way out is not a claim about the palette, just the identity
 * mapping for a color that has already been gamut-mapped. Rounding in the emitted
 * four-decimal oklch can move a channel by 1/255, so compare with
 * {@link expectSameColor} rather than string equality.
 */
function hexOf(value: string): string {
  const okhsl = variantToOkhsl(glaze.color(value).resolve().light);

  return srgbToHex(okhslToSrgb(okhsl.h, okhsl.s, okhsl.l, false));
}

/**
 * An emitted token value's OKHST tone (0–100) — the axis the recipe is authored on.
 *
 * Reading the tone rather than the color is what lets a test say "this landed where the
 * seed asked" for a token whose hue and chroma are settled but whose lightness went
 * through a scheme window.
 */
function toneOf(value: string): number {
  return (
    okhslToOkhst(variantToOkhsl(glaze.color(value).resolve().light)).t * 100
  );
}

/** Hue of an emitted `oklch(L C H)` token value. */
function hueOf(value: string): number {
  return Number(value.trim().split(/\s+/)[2].replace(')', ''));
}

/**
 * Chroma of an emitted `oklch(L C H)` token value.
 *
 * The one channel that answers "is this grey?", which is the whole question the
 * base saturation seed and `surfaceMode` are about.
 */
function chromaOf(value: string): number {
  return Number(value.trim().split(/\s+/)[1]);
}

/** WCAG contrast ratio between two emitted token values. */
function contrastOf(a: string, b: string): number {
  const luminance = (value: string) => {
    const { h, s, l } = variantToOkhsl(glaze.color(value).resolve().light);

    return relativeLuminanceFromLinearRgb(okhslToLinearSrgb(h, s, l, false));
  };

  return contrastRatioFromLuminance(luminance(a), luminance(b));
}

/**
 * Two colors are the same to within one 8-bit channel step.
 *
 * The tolerance is the emitted oklch string's own rounding, not slack in the
 * palette: `#FFD400` serializes to `oklch(0.8809 0.1806 94.02)`, which reads back as
 * `#ffd401`. Asserting exact hex equality would make the test a hostage to the
 * serializer's decimal count.
 */
function expectSameColor(actual: string, expected: string, label: string) {
  const channels = (hex: string) =>
    [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));

  const [ar, ag, ab] = channels(actual);
  const [er, eg, eb] = channels(expected);

  expect(
    Math.max(Math.abs(ar - er), Math.abs(ag - eg), Math.abs(ab - eb)),
    `${label}: ${actual} vs ${expected}`,
  ).toBeLessThanOrEqual(1);
}

describe('palette tokens', () => {
  afterEach(() => {
    resetPaletteConfig();
  });

  it('resolves the default palette to a stable set of values', () => {
    const dump = dumpTokens(getPaletteTokens());

    // Sanity check before the snapshot: a truncated palette would otherwise
    // snapshot cleanly and silently.
    expect(Object.keys(dump).length).toBeGreaterThan(100);

    expect(dump).toMatchSnapshot();
  });

  it('emits every token in all four scheme variants by default', () => {
    expect(statesOf(getPaletteTokens())).toEqual([
      '',
      '@dark',
      '@dark & @hc',
      '@hc',
    ]);
  });
});

describe('setPaletteConfig', () => {
  let baseline: Record<string, string>;

  beforeEach(() => {
    resetPaletteConfig();
    baseline = dumpTokens(getPaletteTokens());
  });

  afterEach(() => {
    resetPaletteConfig();
  });

  it('re-seeds the brand hue and restores it on reset', () => {
    setPaletteConfig({ hue: 30 });

    const tuned = dumpTokens(getPaletteTokens());

    expect(tuned).not.toEqual(baseline);
    // The neutral surface carries a low-saturation brand tint, so it moves too.
    expect(tuned['#surface']).not.toBe(baseline['#surface']);
    expect(tuned['#accent-surface']).not.toBe(baseline['#accent-surface']);

    resetPaletteConfig();

    expect(dumpTokens(getPaletteTokens())).toEqual(baseline);
  });

  it('leaves the syntax-highlighting hues pinned when the brand hue moves', () => {
    const before = getPaletteTokens();
    const codeTokens = Object.keys(before).filter((name) =>
      name.startsWith('#code-'),
    );
    const hues = codeTokens.map((name) => huesOf(before, name));

    // Re-seed the brand onto `code-number`'s hue: with `code-string` still
    // tracking the brand seed, strings and numbers would become
    // indistinguishable in a code block.
    setPaletteConfig({ hue: 156.9 });

    const after = getPaletteTokens();

    expect(codeTokens).toHaveLength(7);
    expect(codeTokens.map((name) => huesOf(after, name))).toEqual(hues);

    // Lightness / chroma may still move: each `code-*` token is anchored to
    // `surface` with an `['AA','AAA']` floor, and the dark surface carries a
    // tint of the brand hue, so the contrast solve re-runs against a new base.
    expect(huesOf(after, '#code-string')[0]).toBe('280.3');
  });

  it('scopes a status-theme seed to that theme only', () => {
    setPaletteConfig({ themes: { danger: { hue: 200 } } });

    const tuned = dumpTokens(getPaletteTokens());
    const moved = Object.keys(baseline).filter(
      (name) => tuned[name] !== baseline[name],
    );

    expect(moved.length).toBeGreaterThan(0);
    expect(moved.every((name) => name.startsWith('#danger-'))).toBe(true);
  });

  it('moves the base zone without touching the accent zone', () => {
    setPaletteConfig({ baseHue: 60 });

    const tuned = dumpTokens(getPaletteTokens());
    const moved = Object.keys(baseline).filter(
      (name) => tuned[name] !== baseline[name],
    );

    // The neutral chrome re-hues…
    for (const name of [
      '#surface-2',
      '#surface-text',
      '#border',
      '#placeholder',
    ])
      expect(moved, name).toContain(name);

    // …while everything the accent hue owns stays put.
    for (const name of [
      '#accent-surface',
      '#accent-icon',
      '#focus',
      '#primary-accent-surface',
      '#special-accent-surface',
      '#danger-accent-surface',
      '#code-keyword',
    ])
      expect(moved, name).not.toContain(name);
  });

  it('leaves a colored theme tinted with its own hue, not the base hue', () => {
    setPaletteConfig({ baseHue: 60 });

    const tuned = dumpTokens(getPaletteTokens());

    // A danger banner must read as red whatever the chrome does.
    expect(tuned['#danger-surface']).toBe(baseline['#danger-surface']);
    expect(tuned['#danger-surface-text']).toBe(
      baseline['#danger-surface-text'],
    );
  });

  it('ships with a white page surface that no saturation can tint', () => {
    // The premise `surfaceMode: 'tinted'` exists to fix: at the end of the tone
    // scale there is no room for chroma, so the base seed has nothing to act on.
    setPaletteConfig({ pastel: false, baseSaturation: 100 });

    expect(chromaOf(variant(getPaletteTokens(), '')['#surface'])).toBe(0);
  });

  it('moves the surface ramp two tones inward when tinted', () => {
    const before = variant(getPaletteTokens(), '');

    setPaletteConfig({ surfaceMode: 'tinted' });

    const after = variant(getPaletteTokens(), '');

    expect(toneOf(before['#surface'])).toBeCloseTo(100, 1);
    // Within half a tone: the emitted value has been through the light tone
    // window and an sRGB gamut map, neither of which lands on exact integers.
    expect(toneOf(after['#surface'])).toBeCloseTo(98, 0);

    // The ladder is positioned relative to `surface`, so it follows on its own.
    for (const name of ['#surface-2', '#surface-3', '#surface-4'])
      expect(toneOf(after[name]), name).toBeCloseTo(
        toneOf(before[name]) - 2,
        0,
      );
  });

  it('lets the base seed tint the page once there is room for it', () => {
    setPaletteConfig({ surfaceMode: 'tinted', pastel: false });

    const chroma = (baseSaturation: number) =>
      chromaOf(
        (
          renderColorTokens({
            surfaceMode: 'tinted',
            pastel: false,
            baseSaturation,
          })['#surface'] as string
        ).toString(),
      );

    expect(chroma(0)).toBe(0);
    expect(chroma(100)).toBeGreaterThan(chroma(40));
    expect(chroma(40)).toBeGreaterThan(0);
  });

  it('keeps the accent zone still while the base seed moves', () => {
    setPaletteConfig({ pastel: false, saturation: 80 });

    const baseline80 = variant(getPaletteTokens(), '');

    // Under `80` the base zone sits at `9.6`; `2` is genuinely below it.
    setPaletteConfig({ pastel: false, saturation: 80, baseSaturation: 2 });

    const muted = variant(getPaletteTokens(), '');

    // The chrome desaturates…
    for (const name of ['#surface-2', '#surface-3', '#border', '#placeholder'])
      expect(chromaOf(muted[name]), name).toBeLessThan(
        chromaOf(baseline80[name]),
      );

    // …and takes on more when asked, rather than only ever less.
    setPaletteConfig({ pastel: false, saturation: 80, baseSaturation: 30 });

    const tinted = variant(getPaletteTokens(), '');

    for (const name of ['#surface-2', '#surface-3', '#border', '#placeholder'])
      expect(chromaOf(tinted[name]), name).toBeGreaterThan(
        chromaOf(baseline80[name]),
      );

    // Through all of it the brand does not move.
    for (const name of ['#accent-surface', '#accent-text', '#focus']) {
      expect(muted[name], name).toBe(baseline80[name]);
      expect(tinted[name], name).toBe(baseline80[name]);
    }
  });

  it('follows the palette seed at the recipe share until the base seed is set', () => {
    setPaletteConfig({ pastel: false, saturation: 55 });

    // 12% of the seed — the factor `surface` carries in the recipe.
    expect(getPaletteConfig().baseSaturation).toBeCloseTo(6.6, 5);

    setPaletteConfig({ pastel: false, saturation: 55, baseSaturation: 20 });

    expect(getPaletteConfig().baseSaturation).toBe(20);
    expect(getPaletteConfig().saturation).toBe(55);
  });

  it('reproduces the shipped chrome at the default base seed', () => {
    const shipped = variant(getPaletteTokens(), '');

    // Stating the number the default resolves to has to be a no-op, or the two
    // halves of the default have drifted apart.
    setPaletteConfig({ baseSaturation: 100 * 0.12 });

    const stated = variant(getPaletteTokens(), '');

    for (const name of [
      '#surface',
      '#surface-2',
      '#border',
      '#surface-text',
      '#code-keyword',
    ])
      expect(stated[name], name).toBe(shipped[name]);
  });

  it('leaves pastel alone when only the base seed is written', () => {
    // A palette-level `saturation` turns pastel off, because tuning it is the
    // non-pastel path. How much hue the chrome carries says nothing about which
    // chroma space the palette is in, so this one must not.
    setPaletteConfig({ baseSaturation: 40 });

    expect(getPaletteConfig().pastel).toBe(true);
  });

  it('unlinks a status saturation from the palette seed once set explicitly', () => {
    // Until it is set, `warning` follows the palette seed…
    setPaletteConfig({ saturation: 50 });
    expect(getPaletteConfig().themes.warning.saturation).toBe(50);

    // …setting it pins it…
    setPaletteConfig({
      saturation: 50,
      themes: { warning: { saturation: 90 } },
    });
    expect(getPaletteConfig().themes.warning.saturation).toBe(90);

    // …and it then stays put while the seed keeps moving, as long as the config
    // carrying it survives — which is what the updater form is for.
    setPaletteConfig((config) => ({ ...config, saturation: 30 }));
    expect(getPaletteConfig().saturation).toBe(30);
    expect(getPaletteConfig().themes.warning.saturation).toBe(90);

    // Dropping the pin makes it inherit again.
    setPaletteConfig({ saturation: 20 });
    expect(getPaletteConfig().themes.warning.saturation).toBe(20);
  });

  it('reports which fields are pinned and which still inherit', () => {
    expect(getPaletteConfigInput().themes?.warning?.saturation).toBeUndefined();

    setPaletteConfig({ themes: { warning: { saturation: 90 } } });

    expect(getPaletteConfigInput().themes?.warning?.saturation).toBe(90);
  });

  it('notifies when only the pinned-ness changes, not the values', () => {
    const seen: number[] = [];
    const unsubscribe = subscribePaletteConfig(() =>
      seen.push(getPaletteVersion()),
    );

    // Pin `warning` to the value it already inherited: every resolved color is
    // identical, but a settings UI has to re-render to stop showing "inherited".
    const inherited = getPaletteConfig().themes.warning.saturation;
    setPaletteConfig({ themes: { warning: { saturation: inherited } } });

    expect(seen).toHaveLength(1);
    expect(getPaletteConfigInput().themes?.warning?.saturation).toBe(inherited);

    // Clearing it again is likewise observable.
    setPaletteConfig({ themes: { warning: { saturation: undefined } } });

    expect(seen).toHaveLength(2);
    expect(getPaletteConfigInput().themes?.warning?.saturation).toBeUndefined();

    // Pinning a field that was inherited is itself a change, so the first write
    // notifies…
    setPaletteConfig({ hue: 200 });
    expect(seen).toHaveLength(3);

    // …but re-applying an already-pinned value costs nothing. This is the
    // `<Root palette={{ hue: 200 }}>` case: an inline literal on every render.
    setPaletteConfig({ hue: 200 });
    setPaletteConfig({ hue: 200 });

    expect(seen).toHaveLength(3);

    unsubscribe();
  });

  it('drops a field that the new config leaves out', () => {
    setPaletteConfig({
      saturation: 50,
      themes: { warning: { saturation: 90 } },
    });
    expect(getPaletteConfig().themes.warning.saturation).toBe(90);

    // Omitting the pin is how you remove it — no `undefined` needed.
    setPaletteConfig({ saturation: 50 });

    expect(getPaletteConfig().themes.warning.saturation).toBe(50);
    expect(getPaletteConfigInput().themes?.warning?.saturation).toBeUndefined();

    // An explicit `undefined` is equivalent, since neither is a value.
    setPaletteConfig({ saturation: undefined });

    expect(getPaletteConfig().saturation).toBe(
      DEFAULT_PALETTE_CONFIG.saturation,
    );

    // Dropping it from inside an updater works the same way.
    setPaletteConfig({ hue: 200, baseHue: 60 });
    setPaletteConfig(({ baseHue, ...config }) => config);

    expect(getPaletteConfig().baseHue).toBe(200);
  });

  it('cascades a palette-level saturation into themes that set none', () => {
    setPaletteConfig({ saturation: 40 });

    expect(getPaletteConfig().themes.danger.saturation).toBe(40);
    expect(getPaletteConfig().themes.warning.saturation).toBe(40);

    // An explicit per-theme value wins and keeps winning as the palette-level
    // value moves again.
    setPaletteConfig((config) => ({
      ...config,
      themes: { warning: { saturation: 95 } },
    }));
    setPaletteConfig((config) => ({ ...config, saturation: 55 }));

    expect(getPaletteConfig().themes.warning.saturation).toBe(95);
    expect(getPaletteConfig().themes.danger.saturation).toBe(55);
  });

  it('applies pastel and restores on reset', () => {
    // Pastel is the shipped default, so turning it OFF is what perturbs the
    // palette here. The round-trip being asserted is the same one either way.
    setPaletteConfig({ pastel: false });

    expect(dumpTokens(getPaletteTokens())).not.toEqual(baseline);

    resetPaletteConfig();

    expect(dumpTokens(getPaletteTokens())).toEqual(baseline);
  });

  it('threads pastel into every theme, including the standalone special one', () => {
    setPaletteConfig({ pastel: true });

    const palette = getPalette();

    // `extend()` merges the parent's config override, so the derived themes
    // inherit it — but `special` is a standalone `glaze()` call, so it is the
    // one that a careless implementation leaves non-pastel.
    expect(palette.list()).toContain('special');

    for (const name of palette.list()) {
      expect(palette.theme(name)?.getConfig().pastel, name).toBe(true);
    }
  });

  it('keeps pastel out of the syntax palette', () => {
    // The code theme is seeded off `themes.code.saturation` alone. `pastel`
    // lowers the chroma ceiling far enough to take `code-keyword` from ~0.19 to
    // ~0.07 — every syntax hue collapsing toward the same washed-out grey — so
    // it stops at the code theme's door.
    const before = CODE_TOKENS.map((name) => baseline[name]);

    // Toggled OFF rather than on: pastel ships enabled, so this is the direction
    // that actually moves the palette out from under the code theme.
    setPaletteConfig({ pastel: false });

    const tuned = dumpTokens(getPaletteTokens());

    // Bit-identical, in all four scheme variants: nothing but the code
    // saturation reaches these.
    expect(CODE_TOKENS.map((name) => tuned[name])).toEqual(before);
    expect(getCodeTheme().getConfig().pastel).toBe(false);

    // Not a no-op config — the rest of the palette did move.
    expect(tuned['#surface']).not.toBe(baseline['#surface']);
  });

  it('still answers to the code saturation while pastel is on', () => {
    setPaletteConfig({ pastel: true, themes: { code: { saturation: 30 } } });

    const tuned = dumpTokens(getPaletteTokens());

    expect(CODE_TOKENS.map((name) => tuned[name])).not.toEqual(
      CODE_TOKENS.map((name) => baseline[name]),
    );
  });

  it('replaces the whole config rather than accumulating', () => {
    setPaletteConfig({ hue: 30 });
    setPaletteConfig({ themes: { note: { hue: 12 } } });

    // The second call did not mention `hue`, so there is no `hue` any more.
    expect(getPaletteConfig().hue).toBe(DEFAULT_PALETTE_CONFIG.hue);
    expect(getPaletteConfig().themes.note.hue).toBe(12);
  });

  it('keeps sibling themes when an updater patches one nested seed', () => {
    // The shape every one-field control in a settings UI needs: `themes` is one
    // field, so patching a seed without spreading it drops the other three.
    setPaletteConfig({ hue: 30, themes: { danger: { hue: 12 } } });
    setPaletteConfig((config) => ({
      ...config,
      themes: { ...config.themes, note: { hue: 200 } },
    }));

    const { hue, themes } = getPaletteConfig();

    expect(hue).toBe(30);
    expect(themes.danger.hue).toBe(12);
    expect(themes.note.hue).toBe(200);
  });

  it('layers onto the current config from an updater', () => {
    setPaletteConfig({ hue: 30 });
    setPaletteConfig((config) => ({
      ...config,
      themes: { note: { hue: 12 } },
    }));

    expect(getPaletteConfig().hue).toBe(30);
    expect(getPaletteConfig().themes.note.hue).toBe(12);
  });

  it('hands the updater the sparse config, not the resolved one', () => {
    setPaletteConfig({ hue: 30 });

    let seen: PaletteConfig | undefined;
    setPaletteConfig((config) => {
      seen = config;

      return config;
    });

    // `baseHue` inherits `hue`, and the updater has to be able to tell that from
    // a `baseHue` pinned to 30 — otherwise spreading would silently pin it.
    expect(seen).toEqual({ hue: 30 });
  });

  it('resets to the shipped config', () => {
    setPaletteConfig({ hue: 30, pastel: true, contrastLevel: 40 });
    resetPaletteConfig();

    expect(getPaletteConfig()).toEqual(DEFAULT_PALETTE_CONFIG);
  });

  it('invalidates the downstream token caches', () => {
    const before = getColorTokens()['#surface'];

    setPaletteConfig({ hue: 30 });

    expect(getColorTokens()['#surface']).not.toEqual(before);
  });
});

describe('contrastLevel', () => {
  let auto: Styles;

  beforeEach(() => {
    resetPaletteConfig();
    auto = getPaletteTokens();
  });

  afterEach(() => {
    resetPaletteConfig();
  });

  it('keeps the high-contrast tier at a manual level, unchanged', () => {
    // The level positions the NORMAL variants on the slider and nothing else. The
    // high-contrast tier stays the true high-contrast resolution, so the two
    // compose: a slider raises the baseline while `prefers-contrast: more` still
    // escalates on top of it.
    setPaletteConfig({ contrastLevel: 50 });

    const tuned = getPaletteTokens();

    expect(statesOf(tuned)).toEqual(['', '@dark', '@dark & @hc', '@hc']);
    expect(variant(tuned, '@hc')).toEqual(variant(auto, '@hc'));
    expect(variant(tuned, '@dark & @hc')).toEqual(variant(auto, '@dark & @hc'));

    // …and the normal variants really did move, or the assertion above would be
    // vacuous.
    expect(variant(tuned, '')).not.toEqual(variant(auto, ''));
  });

  it('emits one tier at level 100, where the two would be identical', () => {
    // At the top of the ramp the normal variants already ARE the high-contrast
    // ones, so a separate tier would only duplicate them.
    setPaletteConfig({ contrastLevel: 100 });

    expect(statesOf(getPaletteTokens())).toEqual(['', '@dark']);
  });

  it('reproduces `auto` exactly at level 0', () => {
    // Every tier, not just the normal pair: level 0 is the whole `'auto'` palette,
    // so "ship the slider but default it off" costs a consumer nothing.
    setPaletteConfig({ contrastLevel: 0 });

    expect(dumpTokens(getPaletteTokens())).toEqual(dumpTokens(auto));
  });

  it('reproduces the high-contrast output at level 100', () => {
    const contrast = variant(auto, '@hc');
    const darkContrast = variant(auto, '@dark & @hc');

    setPaletteConfig({ contrastLevel: 100 });

    const tokens = getPaletteTokens();

    expect(variant(tokens, '')).toEqual(contrast);
    expect(variant(tokens, '@dark')).toEqual(darkContrast);
  });

  it('restores the high-contrast tier when set back to auto', () => {
    setPaletteConfig({ contrastLevel: 50 });
    setPaletteConfig({ contrastLevel: 'auto' });

    expect(dumpTokens(getPaletteTokens())).toEqual(dumpTokens(auto));
  });
});

describe('code syntax tokens', () => {
  afterEach(() => {
    resetPaletteConfig();
  });

  const lightOf = (name: string) =>
    (getPaletteTokens()[name] as TokenStates)[''];

  it('does not scale with the palette saturation', () => {
    const before = CODE_TOKENS.map(lightOf);

    // Halving the palette saturation used to halve the syntax chroma with it.
    setPaletteConfig({ saturation: 40 });

    expect(CODE_TOKENS.map(lightOf)).toEqual(before);

    setPaletteConfig({ saturation: 100 });

    expect(CODE_TOKENS.map(lightOf)).toEqual(before);
  });

  it('responds to its own saturation', () => {
    const before = lightOf('#code-keyword');

    setPaletteConfig({ themes: { code: { saturation: 30 } } });

    expect(lightOf('#code-keyword')).not.toBe(before);
  });

  it('keeps its own saturation while the rest of the palette moves', () => {
    setPaletteConfig({
      saturation: 30,
      themes: { code: { saturation: 90 } },
    });

    expect(getPaletteConfig().themes.code.saturation).toBe(90);
    // Every other theme follows the palette-level seed…
    expect(getPaletteConfig().themes.danger.saturation).toBe(30);
    // …and `code` keeps its own even after the palette-level one moves again.
    setPaletteConfig((config) => ({ ...config, saturation: 70 }));
    expect(getPaletteConfig().themes.code.saturation).toBe(90);
  });

  it('defaults to the shipped saturation rather than inheriting', () => {
    setPaletteConfig({ saturation: 20 });

    // `DEFAULT_CODE_SATURATION`, not `DEFAULT_PALETTE_CONFIG.saturation`: the two
    // parted ways when the app seed moved to 100 for pastel. Asserting against the
    // palette-level default here would silently re-couple them.
    expect(getPaletteConfig().themes.code.saturation).toBe(
      DEFAULT_CODE_SATURATION,
    );
  });

  it('emits only the code tokens, not the surface it is anchored to', () => {
    const names = Object.keys(getPaletteTokens());

    expect(names.filter((n) => n.startsWith('#code-')).sort()).toEqual(
      [...CODE_TOKENS].sort(),
    );
    // The code theme mirrors `surface` purely as a contrast base.
    expect(getCodeTheme().has('surface')).toBe(true);
    expect(names).not.toContain('#code-surface');
  });

  it('anchors its contrast floors to the real surface', () => {
    // Pinned non-pastel: bit-for-bit equality is the invariant only when the page
    // is non-pastel too. Under the pastel default the code theme stays unsoftened
    // while `surface` softens, so the mirror's chroma diverges by design — the
    // sibling test below covers that case on tone, which is what the floors are
    // actually solved against.
    setPaletteConfig({ pastel: false });

    // The mirrored base must resolve to the same colour the code sits on, or the
    // AA/AAA floors would be solved against the wrong background.
    const mirrored = getCodeTheme().tokens({
      modes: { dark: true, highContrast: true },
    });
    const live = getPaletteTokens()['#surface'] as TokenStates;

    expect(mirrored.light.surface).toBe(live['']);
    expect(mirrored.dark?.surface).toBe(live['@dark']);
  });

  it('keeps the mirror on the real surface tone under pastel', () => {
    setPaletteConfig({ pastel: true });

    const mirrored = getCodeTheme().tokens({
      modes: { dark: true, highContrast: true },
    });
    const live = getPaletteTokens()['#surface'] as TokenStates;

    // The mirror goes non-pastel along with the rest of the code theme, so its
    // chroma no longer tracks the softened page. That is the whole cost of
    // holding pastel off here, and it is a cheap one: `surface` sits at
    // saturation factor 0.12, where the pastel ceiling moves chroma only — the
    // lightness the AA/AAA floors are actually solved against stays exact.
    const lightnessOf = (value: string) =>
      value.trim().split(/\s+/)[0].replace('oklch(', '');

    expect(lightnessOf(mirrored.light.surface)).toBe(lightnessOf(live['']));
    expect(lightnessOf(mirrored.dark!.surface)).toBe(
      lightnessOf(live['@dark']),
    );
  });

  it('warns instead of silently clamping an unreachable mirror', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // 0.12 * 100 / 5 = 2.4, past Glaze's 0–1 factor range.
    setPaletteConfig({ saturation: 100, themes: { code: { saturation: 5 } } });
    getPaletteTokens();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('themes.code.saturation'),
    );

    warn.mockRestore();
  });
});

describe('renderPaletteTokens', () => {
  afterEach(() => {
    resetPaletteConfig();
  });

  it('returns flat literal values, not state maps', () => {
    const rendered = renderPaletteTokens();

    expect(Object.keys(rendered).length).toBe(
      Object.keys(getPaletteTokens()).length,
    );
    for (const value of Object.values(rendered)) {
      expect(typeof value).toBe('string');
    }
    expect(rendered['#surface']).toMatch(/^oklch\(/);
  });

  it('matches the corresponding variant of the document palette', () => {
    const live = getPaletteTokens();
    const variantOf = (state: string) => {
      const out: Record<string, unknown> = {};
      for (const name of Object.keys(live)) {
        out[name] = (live[name] as TokenStates)[state];
      }
      return out;
    };

    expect({ ...renderPaletteTokens({ scheme: 'light' }) }).toEqual(
      variantOf(''),
    );
    expect({ ...renderPaletteTokens({ scheme: 'dark' }) }).toEqual(
      variantOf('@dark'),
    );
    expect({
      ...renderPaletteTokens({ scheme: 'light', highContrast: true }),
    }).toEqual(variantOf('@hc'));
    expect({
      ...renderPaletteTokens({ scheme: 'dark', highContrast: true }),
    }).toEqual(variantOf('@dark & @hc'));
  });

  it('renders a config the app is not using, without applying it', () => {
    const before = dumpTokens(getPaletteTokens());
    const baseline = renderPaletteTokens({ scheme: 'light' });

    const preview = renderPaletteTokens({ hue: 30, scheme: 'light' });

    expect(preview['#accent-surface']).not.toBe(baseline['#accent-surface']);
    // The live palette and the stored config must be untouched.
    expect(dumpTokens(getPaletteTokens())).toEqual(before);
    expect(getPaletteConfig()).toEqual(DEFAULT_PALETTE_CONFIG);
  });

  it('merges over the current config rather than the shipped defaults', () => {
    setPaletteConfig({ saturation: 20 });

    expect(renderPaletteTokens({ scheme: 'light' })['#accent-surface']).toBe(
      getPaletteTokens()['#accent-surface']?.[''],
    );
  });

  it('is independent of the ambient contrast mode', () => {
    const hc = renderPaletteTokens({ scheme: 'light', highContrast: true });

    // A manual global level suppresses high-contrast output in Glaze exports;
    // a preview must not inherit that.
    setPaletteConfig({ contrastLevel: 60 });

    expect(
      renderPaletteTokens({
        contrastLevel: 'auto',
        scheme: 'light',
        highContrast: true,
      }),
    ).toEqual(hc);
  });

  it('restores the global contrast level it borrowed', () => {
    setPaletteConfig({ contrastLevel: 60 });
    getPaletteTokens();

    expect(glaze.getConfig().contrastLevel).toBe(60);

    renderPaletteTokens({ scheme: 'dark' });

    expect(glaze.getConfig().contrastLevel).toBe(60);
  });

  it('still escalates high contrast under a manual level', () => {
    // A region asking for high contrast at a mid level gets the genuine
    // high-contrast resolution, not a copy of its own normal variant — the level
    // moves the baseline, the tier escalates from wherever `'auto'` would put it.
    const normal = renderPaletteTokens({ contrastLevel: 40, scheme: 'light' });
    const hc = renderPaletteTokens({
      contrastLevel: 40,
      scheme: 'light',
      highContrast: true,
    });
    const autoHc = renderPaletteTokens({
      contrastLevel: 'auto',
      scheme: 'light',
      highContrast: true,
    });

    expect(hc).not.toEqual(normal);
    expect(hc).toEqual(autoHc);
  });

  it('emits one tier at level 100, where the two coincide', () => {
    const normal = renderPaletteTokens({ contrastLevel: 100, scheme: 'light' });
    const hc = renderPaletteTokens({
      contrastLevel: 100,
      scheme: 'light',
      highContrast: true,
    });

    expect(hc).toEqual(normal);
  });

  it('reproduces the two contrast tiers at levels 0 and 100', () => {
    // Glaze guarantees level 0 === normal and level 100 === high contrast, bit
    // for bit. If the level did not reach the themes in the region path, these
    // would silently all be the same.
    for (const scheme of ['light', 'dark'] as const) {
      expect(renderPaletteTokens({ contrastLevel: 0, scheme })).toEqual(
        renderPaletteTokens({ contrastLevel: 'auto', scheme }),
      );
      expect(renderPaletteTokens({ contrastLevel: 100, scheme })).toEqual(
        renderPaletteTokens({
          contrastLevel: 'auto',
          scheme,
          highContrast: true,
        }),
      );
    }
  });

  it('interpolates between the tiers at intermediate levels', () => {
    const at = (contrastLevel: number | 'auto') =>
      renderPaletteTokens({ contrastLevel, scheme: 'light' });

    const low = at(0);
    const mid = at(50);
    const high = at(100);

    expect(mid).not.toEqual(low);
    expect(mid).not.toEqual(high);

    // Sample a token whose high-contrast variant genuinely differs, and check
    // the mid level lands strictly between the two tiers rather than snapping.
    const NAME = '#surface-text-soft-2';
    const tone = (tokens: Tokens) =>
      Number(String(tokens[NAME]).match(/oklch\(([\d.]+)/)![1]);

    expect(tone(low)).not.toBeCloseTo(tone(high), 3);
    expect(tone(mid)).toBeGreaterThan(Math.min(tone(low), tone(high)));
    expect(tone(mid)).toBeLessThan(Math.max(tone(low), tone(high)));
  });

  it('applies the level to every theme in the palette, not just the default', () => {
    const auto = renderPaletteTokens({
      contrastLevel: 'auto',
      scheme: 'light',
      highContrast: true,
    });
    const full = renderPaletteTokens({ contrastLevel: 100, scheme: 'light' });

    // `special` is a standalone theme and the status themes are `extend()`
    // children — the level has to reach all of them.
    for (const name of [
      '#danger-surface',
      '#success-accent-text',
      '#primary-border',
      '#special-accent-surface',
      '#note-surface-text-soft',
    ]) {
      expect(full[name], name).toBe(auto[name]);
    }
  });
});

describe('renderColorTokens', () => {
  afterEach(() => {
    resetPaletteConfig();
  });

  it('adds the legacy aliases by reference, not resolved', () => {
    const rendered = renderColorTokens({ scheme: 'dark' });

    // Resolved palette value…
    expect(rendered['#surface-text']).toMatch(/^oklch\(/);
    // …but the alias stays a reference, so it re-resolves inside the region.
    expect(rendered['#dark']).toBe('#surface-text');
    expect(rendered['#minor']).toBe('#surface-text-soft.65');
    expect(rendered['#clear']).toBe('transparent');
  });

  it('covers every color token the document exposes', () => {
    const rendered = renderColorTokens();
    const live = getColorTokens();

    for (const name of Object.keys(live)) {
      expect(rendered, name).toHaveProperty(name);
    }
  });

  it('re-declares the tokens whose values embed a palette color', () => {
    const rendered = renderColorTokens({ scheme: 'dark' });

    // Declared on <Root>, so CSS would have frozen the outer theme's color into
    // them; they have to ride along by reference to re-resolve in the region.
    expect(rendered['$card-shadow']).toBe('0 .5x 2x #shadow-md');
    expect(rendered['#scrollbar-thumb']).toBe('#text.5');
    expect(rendered['#scrollbar-bg']).toBe('#surface-2');
  });
});

describe('interop with a host driving glaze directly', () => {
  afterEach(() => {
    resetPaletteConfig();
    glaze.configure({ contrastLevel: 'auto', darkDesaturation: 0 });
    invalidatePaletteTokens();
  });

  it('leaves a host-set global contrast level alone', () => {
    // `contrastLevel` is process-global, so it is shared with the host. We must
    // only write it when the palette config actually asks for a level.
    glaze.configure({ contrastLevel: 60 });
    invalidatePaletteTokens();
    getPaletteTokens();

    expect(glaze.getConfig().contrastLevel).toBe(60);
  });

  it('clears the level it set itself on reset', () => {
    setPaletteConfig({ contrastLevel: 40 });
    getPaletteTokens();

    expect(glaze.getConfig().contrastLevel).toBe(40);

    resetPaletteConfig();
    getPaletteTokens();

    expect(glaze.getConfig().contrastLevel).toBe('auto');
  });

  it('re-resolves after a direct glaze.configure once invalidated', () => {
    const before = dumpTokens(getPaletteTokens());

    glaze.configure({ darkDesaturation: 0.5 });

    // Glaze invalidates its own caches, but ours are keyed on the palette
    // config version — hence the explicit escape hatch.
    expect(dumpTokens(getPaletteTokens())).toEqual(before);

    invalidatePaletteTokens();

    expect(dumpTokens(getPaletteTokens())).not.toEqual(before);
  });

  it('re-renders region tokens too, not just the document ones', () => {
    // The render memo is keyed on the palette config, but the config is not its
    // only input — `buildPalette` also reads Glaze's global config. Without the
    // version in that key, a region preview keeps serving the old palette while
    // the document around it has already moved.
    const before = renderColorTokens({ scheme: 'dark' });

    glaze.configure({ darkDesaturation: 0.5 });
    invalidatePaletteTokens();

    expect(renderColorTokens({ scheme: 'dark' })).not.toEqual(before);
  });
});

describe('config immutability', () => {
  afterEach(() => {
    resetPaletteConfig();
  });

  it('does not follow the caller mutating the object afterwards', () => {
    const config: PaletteConfig = { hue: 200 };

    setPaletteConfig(config);
    config.hue = 300;

    expect(getPaletteConfig().hue).toBe(200);
    expect(getPaletteConfigInput().hue).toBe(200);
  });

  it('freezes what it hands out, so a stray write cannot desync the caches', () => {
    setPaletteConfig({ hue: 200, themes: { danger: { hue: 12 } } });

    // Silent corruption is the failure being prevented: a write that landed
    // would move the config without bumping the version, leaving every token
    // cache serving colors that no longer match it.
    expect(() => {
      (getPaletteConfig() as { hue: number }).hue = 300;
    }).toThrow();
    expect(() => {
      (getPaletteConfigInput().themes!.danger as { hue: number }).hue = 300;
    }).toThrow();

    expect(getPaletteConfig().hue).toBe(200);
    expect(getPaletteConfig().themes.danger.hue).toBe(12);
  });

  it('freezes the shipped baseline', () => {
    expect(Object.isFrozen(DEFAULT_PALETTE_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PALETTE_CONFIG.themes)).toBe(true);
  });
});

/**
 * The brand seeded by a COLOR rather than a hue.
 *
 * The contract is narrower than "the palette moves": the color the caller passed has
 * to come out the other side, moved only as far as the fill's 3:1 floor against the
 * page forces it. Every case here is a way that can fail — a tone window quietly
 * remapping it, a contrast floor overshooting, a status theme inheriting a lightness
 * that means nothing to it.
 */
describe('accent color seeds', () => {
  /**
   * Non-pastel unless a case is about pastel.
   *
   * The pastel chroma ceiling makes an exact rendering impossible by construction, so
   * every exactness assertion below has to be on this path.
   */
  const EXACT = { pastel: false } as const;

  const BRANDS = [
    '#7A4DBF',
    '#EF4444',
    '#0EA5E9',
    '#22C55E',
    '#FFD400',
    '#111827',
  ];

  afterEach(() => {
    resetPaletteConfig();
  });

  it('leaves the palette untouched when no color is given', () => {
    const baseline = dumpTokens(getPaletteTokens());

    setPaletteConfig({ hue: DEFAULT_PALETTE_CONFIG.hue });

    expect(getPaletteConfig().accentTone).toBeNull();
    expect(dumpTokens(getPaletteTokens())).toEqual(baseline);
  });

  /**
   * The whole contract, as one invariant: for every brand and every scheme, the fill
   * is EITHER exactly the color asked for, OR sitting on the 3:1 floor — and it is
   * floored only when the color could not clear the floor by itself.
   *
   * Both directions matter. Drop the first and the palette is free to re-derive a
   * shade of the brand (which is what it did before this existed, landing every hue at
   * roughly tone 50). Drop the second and a floor could quietly become a target,
   * darkening a brand that was already legible.
   */
  it('renders the requested color exactly wherever the floor allows', () => {
    for (const accentColor of BRANDS) {
      const tokens = renderPaletteTokens({
        ...EXACT,
        accentColor,
        scheme: 'light',
      });
      const fill = String(tokens['#accent-surface']);
      const surface = String(tokens['#surface']);

      const wanted = contrastOf(accentColor, surface);
      const got = contrastOf(fill, surface);

      if (wanted >= 3) {
        // Nothing to solve, so nothing may move.
        expectSameColor(hexOf(fill), accentColor.toLowerCase(), accentColor);
        expect(got, accentColor).toBeCloseTo(wanted, 2);
      } else {
        // Solved to the floor and stopped there — not to AA, not to the far side.
        expect(got, accentColor).toBeGreaterThanOrEqual(3);
        expect(got, accentColor).toBeLessThan(3.2);
      }
    }
  });

  it('lets dark adapt rather than pinning the color across schemes', () => {
    // Exactness is scoped to light / normal contrast on purpose. Dark is a
    // different page, and a fill pinned to one lightness across both would be a
    // worse `mode: 'fixed'` rather than a faithful brand — so the dark variant
    // maps through the dark tone window like any other fixed-mode color.
    //
    // What must hold in dark is the floor, not the value.
    for (const accentColor of BRANDS) {
      const tokens = renderPaletteTokens({
        ...EXACT,
        accentColor,
        scheme: 'dark',
      });
      const fill = String(tokens['#accent-surface']);

      expect(
        contrastOf(fill, String(tokens['#surface'])),
        accentColor,
      ).toBeGreaterThanOrEqual(3);
    }

    // …and it really is a different value, for a color the window has to move.
    const dark = renderPaletteTokens({
      ...EXACT,
      accentColor: '#FFD400',
      scheme: 'dark',
    });
    expect(hexOf(String(dark['#accent-surface']))).not.toBe('#ffd400');
  });

  it('keeps the fill ramp separated in high contrast', () => {
    // Regression guard, and a latent bug fixed in passing: on the shipped chain all
    // four fills are solved against white behind the same AAA floor, so in high
    // contrast `accent-surface` and `accent-surface-2` collapse onto one value and the
    // hover step disappears. Re-anchoring the ramp onto the fill as a plain tone step
    // is what keeps them apart.
    const hc = renderPaletteTokens({
      ...EXACT,
      accentColor: '#0EA5E9',
      scheme: 'light',
      highContrast: true,
    });

    const ramp = [
      '#accent-surface',
      '#accent-surface-2',
      '#accent-surface-3',
      '#accent-surface-hover',
    ].map((name) => String(hc[name]));

    expect(new Set(ramp).size).toBe(ramp.length);
  });

  /**
   * High contrast keeps AAA whatever the caller asked for.
   *
   * Fidelity to a requested color is a preference; the high-contrast tier is not. It is
   * selected by `prefers-contrast: more` or an explicit `data-contrast="high"`, so
   * anyone reading it has asked for separation over brand — and the relaxed normal floor
   * must not follow them into it.
   */
  it('holds AAA on the brand fill in high contrast, whatever the color', () => {
    for (const accentColor of BRANDS) {
      for (const scheme of ['light', 'dark'] as const) {
        const hc = renderPaletteTokens({
          ...EXACT,
          accentColor,
          scheme,
          highContrast: true,
        });

        // 6.99 rather than 7: Glaze binary-searches the tone to a 1e-4 epsilon, so a
        // solved floor can land a thousandth of a ratio short of its target. Anything
        // that has actually stopped honouring the floor misses by whole points.
        expect(
          contrastOf(String(hc['#accent-surface']), String(hc['#surface'])),
          `${accentColor} ${scheme}`,
        ).toBeGreaterThan(6.99);
      }
    }
  });

  it('keeps the hover link above the rest link in every variant', () => {
    // Not just distinct — correctly ORDERED. The two are pinned to the caller's tone
    // and separated by their floors, so an unreachable target on the hover half does
    // not fail loudly: Glaze pins the tone to an extreme and the hover comes out
    // *less* readable than the rest state. That is how an 11:1 HC target on a
    // saturated hue behaves (`#FFD400` in dark high contrast lands on pure black at
    // 2.23 against the rest state's 7.07), and it is why the hover target is 9.
    for (const accentColor of BRANDS) {
      for (const scheme of ['light', 'dark'] as const) {
        for (const highContrast of [false, true]) {
          const tokens = renderPaletteTokens({
            ...EXACT,
            accentColor,
            scheme,
            highContrast,
          });
          const base = String(tokens['#accent-selected-fill']);
          const label = `${accentColor} ${scheme}${highContrast ? ' hc' : ''}`;

          expect(
            contrastOf(String(tokens['#accent-text']), base),
            label,
          ).toBeGreaterThan(
            contrastOf(String(tokens['#accent-text-soft']), base),
          );
        }
      }
    }
  });

  it('resolves every brand without an unreachable-contrast warning', () => {
    // The guard on the measured `9`. An unmeetable floor is a warning rather than a
    // throw, so without this the pinned-to-an-extreme failure above would be silent.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (const accentColor of BRANDS) {
      for (const scheme of ['light', 'dark'] as const) {
        renderPaletteTokens({ ...EXACT, accentColor, scheme });
        renderPaletteTokens({
          ...EXACT,
          accentColor,
          scheme,
          highContrast: true,
        });
      }
    }

    expect(
      warn.mock.calls
        .map((call) => String(call[0]))
        .filter((message) => /cannot meet|drifts below/.test(message)),
    ).toEqual([]);

    warn.mockRestore();
  });

  it('puts the brand’s own tone on the rest link color', () => {
    // `#accent-text-soft` is the LINK base color, and the payoff of a color seed is
    // that it reads as the brand rather than as a re-derived shade of it.
    //
    // Near, not exact: the text pair stays `mode: 'auto'` so a link inverts on a dark
    // page, and passing through the light tone window costs it ~3 units. Exactness
    // belongs to the fill, which is `mode: 'static'` precisely because it does not have
    // to invert. Two brands three tone-tens apart, so the assertion is that the link
    // TRACKS the seed rather than that one number happens to match.
    for (const accentColor of ['#7A4DBF', '#EF4444']) {
      const tokens = renderPaletteTokens({
        ...EXACT,
        accentColor,
        scheme: 'light',
      });
      const drift = Math.abs(
        toneOf(String(tokens['#accent-text-soft'])) -
          colorSeed(accentColor)!.tone,
      );

      expect(drift, accentColor).toBeLessThan(4);
    }
  });

  it('keeps the rest and hover brand text distinct', () => {
    // Both are pinned to the caller's tone, so a missing hover step would silently
    // collapse them into one color and delete the rest→hover intensify that
    // `#accent-text` exists for.
    for (const accentColor of BRANDS) {
      for (const scheme of ['light', 'dark'] as const) {
        const tokens = renderPaletteTokens({ ...EXACT, accentColor, scheme });

        expect(tokens['#accent-text'], `${accentColor} ${scheme}`).not.toBe(
          tokens['#accent-text-soft'],
        );
      }
    }
  });

  it('leaves the status themes on their own fill derivation', () => {
    // A status hue signals a meaning, so it keeps the white-anchored derivation that
    // lands every hue at a comparable weight. The stakes are higher now that the
    // brand is a literal: `extend()` copies defs, so an inherited `from` would make
    // `#danger-accent-surface` the brand color outright — a yellow danger button, not
    // merely a washed-out one.
    //
    // Compared against the untouched baseline, which is the strong form of the claim.
    // It holds because the accent family carries its own chroma through `from` and no
    // longer raises the palette-level `saturation` to reach it — so a brand color has
    // nothing left to leak into a status theme.
    const seeded = renderPaletteTokens({
      ...EXACT,
      accentColor: '#FFD400',
      scheme: 'light',
    });
    const baseline = renderPaletteTokens({ ...EXACT, scheme: 'light' });

    for (const name of [
      '#danger-accent-surface',
      '#success-accent-surface',
      '#warning-accent-surface',
      '#note-accent-surface',
    ]) {
      expect(seeded[name], name).toBe(baseline[name]);
    }

    // The neutral chrome still re-hues, and should: `baseHue` inherits the accent
    // hue, so the greys keep their faint tint of the brand. What it no longer does is
    // change *chroma* — only the hue moved.
    expect(seeded['#border']).not.toBe(baseline['#border']);
    expect(hueOf(String(seeded['#border']))).toBeCloseTo(
      colorSeed('#FFD400')!.hue,
      1,
    );
  });

  it('carries the brand into the special theme', () => {
    // `special` is the brand-on-dark CTA and `SPECIAL_PRIMARY_STYLES.fill` mirrors
    // `#primary-accent-surface`, so a brand that stopped at the default theme would
    // leave every hero button on the old hue.
    const tokens = renderPaletteTokens({
      ...EXACT,
      accentColor: '#FFD400',
      scheme: 'light',
    });

    expectSameColor(
      hexOf(String(tokens['#special-accent-surface'])),
      '#ffd400',
      'special-accent-surface',
    );
  });

  it('derives only the hue from a base color', () => {
    // A base color says which way the greys lean, not how dark or how vivid they are —
    // so its tone and saturation must not reach anything.
    const seed = colorSeed('#FFD400')!;
    const baseline = renderPaletteTokens({ scheme: 'light' });

    setPaletteConfig({ baseColor: '#FFD400' });

    expect(getPaletteConfig().baseHue).toBeCloseTo(seed.hue, 6);
    expect(getPaletteConfig().hue).toBe(DEFAULT_PALETTE_CONFIG.hue);
    expect(getPaletteConfig().accentTone).toBeNull();
    expect(getPaletteConfig().saturation).toBe(
      DEFAULT_PALETTE_CONFIG.saturation,
    );

    // The base zone moved and the accent zone did not. `baseline` is captured before
    // the write on purpose: `renderPaletteTokens` LAYERS over the live config, so a
    // baseline taken afterwards would already carry the base color.
    const seeded = renderPaletteTokens({ scheme: 'light' });

    expect(seeded['#border']).not.toBe(baseline['#border']);
    expect(seeded['#accent-surface']).toBe(baseline['#accent-surface']);
    expect(seeded['#special-accent-surface']).toBe(
      baseline['#special-accent-surface'],
    );
  });

  it('prefers an explicit hue over the derived one, keeping the tone', () => {
    // The number is the more specific instruction. Keeping the tone regardless is what
    // lets a preview rotate the hue of a stored brand without discarding its
    // lightness.
    const seed = colorSeed('#FFD400')!;

    setPaletteConfig({ accentColor: '#FFD400', hue: 200, ...EXACT });

    expect(getPaletteConfig().hue).toBe(200);
    expect(getPaletteConfig().accentTone).toBeCloseTo(seed.tone, 6);
    expect(getPaletteConfig().saturation).toBeCloseTo(seed.saturation, 6);
  });

  it('takes the hue and tone but not the chroma of a color under pastel', () => {
    const seed = colorSeed('#EF4444')!;

    setPaletteConfig({ accentColor: '#EF4444' });

    // Pastel is one flat ceiling, so there is one saturation and it is the top of the
    // scale — the color's own is deliberately dropped.
    expect(getPaletteConfig().pastel).toBe(true);
    expect(getPaletteConfig().saturation).toBe(
      DEFAULT_PALETTE_CONFIG.saturation,
    );
    expect(getPaletteConfig().saturation).not.toBeCloseTo(seed.saturation, 1);

    // Hue and tone still arrive, so the fill is recognisably the brand — just softer.
    expect(getPaletteConfig().hue).toBeCloseTo(seed.hue, 6);
    expect(getPaletteConfig().accentTone).toBeCloseTo(seed.tone, 6);

    // …and softer is measurable: pastel cannot reproduce the color, non-pastel can.
    // This is the divergence the Theme Builder shows as requested-vs-resolved chips.
    const softened = renderPaletteTokens({
      accentColor: '#EF4444',
      scheme: 'light',
    });
    const exact = renderPaletteTokens({
      ...EXACT,
      accentColor: '#EF4444',
      scheme: 'light',
    });

    expectSameColor(
      hexOf(String(exact['#accent-surface'])),
      '#ef4444',
      'non-pastel',
    );
    expect(hexOf(String(softened['#accent-surface']))).not.toBe('#ef4444');
  });

  it('reads a lone saturation as a request to leave pastel', () => {
    // Tuning a saturation IS the non-pastel path, so writing one picks it. This is
    // also what keeps `setPaletteConfig({ saturation: 55 })` doing what it always
    // did, rather than silently resolving to the value pastel pins.
    setPaletteConfig({ saturation: 55 });

    expect(getPaletteConfig().pastel).toBe(false);
    expect(getPaletteConfig().saturation).toBe(55);

    // Not a pin, though — the config still says nothing about pastel, so a UI
    // reading the sparse config sees a field it may set either way.
    expect(getPaletteConfigInput().pastel).toBeUndefined();
  });

  it('lets an explicit pastel override a saturation, and remembers the number', () => {
    setPaletteConfig({ saturation: 40, pastel: true });

    // `pastel` is the coarser of the two choices — a color space rather than a value
    // on one — so it wins wherever both are set.
    expect(getPaletteConfig().saturation).toBe(
      DEFAULT_PALETTE_CONFIG.saturation,
    );

    // Kept rather than dropped, so turning pastel off restores the caller's number
    // instead of resetting it. That is what makes the two paths a toggle rather than
    // a one-way door — and what lets the Theme Builder's Pastel switch round-trip.
    expect(getPaletteConfigInput().saturation).toBe(40);

    setPaletteConfig((config) => ({ ...config, pastel: false }));
    expect(getPaletteConfig().saturation).toBe(40);
  });

  it('falls back to the numeric seed on a color it cannot parse', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const baseline = dumpTokens(getPaletteTokens());

    // A CSS keyword is the likely typo in a settings field: it looks like a color and
    // Glaze rejects it. Taking the render down over it would be the wrong trade.
    setPaletteConfig({ accentColor: 'rebeccapurple' });

    expect(warn).toHaveBeenCalled();
    expect(getPaletteConfig().hue).toBe(DEFAULT_PALETTE_CONFIG.hue);
    expect(getPaletteConfig().accentTone).toBeNull();
    expect(dumpTokens(getPaletteTokens())).toEqual(baseline);

    warn.mockRestore();
  });

  it('counts a color seed as a pinned field', () => {
    const seen: number[] = [];
    const unsubscribe = subscribePaletteConfig(() =>
      seen.push(getPaletteVersion()),
    );

    const seed = colorSeed('#FFD400')!;

    setPaletteConfig({ hue: seed.hue, saturation: seed.saturation, ...EXACT });
    expect(seen).toHaveLength(1);

    // The same resolved hue and saturation, said a different WAY. A settings UI reads
    // the sparse config to decide whether its hue slider or its color field is in
    // charge, so the swap has to be observable even where the numbers agree.
    setPaletteConfig({ accentColor: '#FFD400', ...EXACT });
    expect(seen).toHaveLength(2);
    expect(getPaletteConfigInput().accentColor).toBe('#FFD400');

    unsubscribe();
  });

  it('previews a color seed without applying it', () => {
    const preview = renderPaletteTokens({
      ...EXACT,
      accentColor: '#FFD400',
      scheme: 'light',
    });

    expect(preview['#accent-surface']).not.toBe(
      renderPaletteTokens({ scheme: 'light' })['#accent-surface'],
    );
    expect(getPaletteConfig()).toEqual(DEFAULT_PALETTE_CONFIG);
  });
});
