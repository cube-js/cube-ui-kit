import {
  contrastRatioFromLuminance,
  glaze,
  okhslToLinearSrgb,
  relativeLuminanceFromLinearRgb,
  variantToOkhsl,
} from '@tenphi/glaze';

import { colorThemeSeed, getColorTheme } from './color-theme';
import {
  DEFAULT_SATURATION,
  resetPaletteConfig,
  setPaletteConfig,
} from './palette-config';

const SCHEMAS = ['', '@dark', '@hc', '@dark & @hc'] as const;

function wcag(background: string, foreground: string): number {
  const luminance = (value: string) => {
    // A resolved variant stores the canonical tone `t`, not an OKHSL lightness —
    // `variantToOkhsl` is Glaze's own adapter for the luminance edge. Reading
    // `.l` off the variant silently yields `undefined` and then `NaN`.
    const { h, s, l } = variantToOkhsl(glaze.color(value).resolve().light);

    return relativeLuminanceFromLinearRgb(okhslToLinearSrgb(h, s, l));
  };

  return contrastRatioFromLuminance(
    luminance(background),
    luminance(foreground),
  );
}

describe('getColorTheme', () => {
  // `beforeEach` as well as `afterEach`: `vitest.config.ts` runs with
  // `isolate: false`, so the module graph — and therefore `palette-config`'s
  // module-level state — is shared with every other file in the same worker.
  // `palette.test.ts` re-seeds the palette too, and leaning on its cleanup is
  // what made the re-seed assertion below pass locally and fail in CI.
  beforeEach(() => {
    resetPaletteConfig();
  });

  afterEach(() => {
    resetPaletteConfig();
  });

  it('emits the tint colors under a hashed prefix', () => {
    const theme = getColorTheme({ hue: 200 });

    expect(theme.name).toMatch(/^tint-[a-z0-9]+$/);
    expect(Object.keys(theme.colors).sort()).toEqual([
      'surface',
      'surface-2',
      'surface-2-text',
      'surface-2-text-soft',
    ]);
    expect(theme.colors.surface).toBe(`#${theme.name}-surface`);
    expect(Object.keys(theme.tokens).sort()).toEqual(
      Object.values(theme.colors).sort(),
    );
  });

  it('covers all four schema variants', () => {
    const theme = getColorTheme({ hue: 200 });

    for (const token of Object.values(theme.colors)) {
      // `'@hc'` is also the guard for `color-theme.ts`'s side-effect import of
      // `./palette`: that module's `glaze.configure` call installs the `@dark` /
      // `@hc` state aliases, and without it Glaze emits
      // `@media(prefers-color-scheme: dark)` keys and no high-contrast tier at
      // all — a silent failure, since the light values still render.
      expect(Object.keys(theme.tokens[token] as object).sort()).toEqual(
        [...SCHEMAS].sort(),
      );
    }
  });

  it('solves the text contrast in every schema', () => {
    const theme = getColorTheme({ hue: 200 });
    const band = theme.tokens[theme.colors['surface-2']] as Record<
      string,
      string
    >;
    const text = theme.tokens[theme.colors['surface-2-text']] as Record<
      string,
      string
    >;

    for (const schema of SCHEMAS) {
      // The Cloud defect this exists to fix: there, contrast was solved once
      // against a white surface at pick time and never re-checked, so a dark
      // schema could invert both sides into an unreadable pair.
      expect(wcag(band[schema], text[schema])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the text readable on the lighter band too', () => {
    const theme = getColorTheme({ hue: 200 });
    const base = theme.tokens[theme.colors.surface] as Record<string, string>;
    const text = theme.tokens[theme.colors['surface-2-text']] as Record<
      string,
      string
    >;

    // The floor is solved against `surface-2`, which is the tighter of the two
    // bands in both schemas — so `surface` clears it for free. That is the whole
    // reason the text is anchored there rather than to `surface`.
    for (const schema of SCHEMAS) {
      expect(wcag(base[schema], text[schema])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives the band a different value from the base', () => {
    const theme = getColorTheme({ hue: 200 });
    const base = theme.tokens[theme.colors.surface] as Record<string, string>;
    const band = theme.tokens[theme.colors['surface-2']] as Record<
      string,
      string
    >;

    // Banding that resolves to the same colour is not banding. This is also what
    // keeps the two out of tasty's value-coalescing trap when they end up in one
    // state map.
    for (const schema of SCHEMAS) {
      expect(band[schema]).not.toBe(base[schema]);
    }
  });

  it('memoizes by config, not by call', () => {
    expect(getColorTheme({ hue: 200 })).toBe(getColorTheme({ hue: 200 }));
    expect(getColorTheme({ hue: 200 })).not.toBe(getColorTheme({ hue: 260 }));
  });

  it('ignores key order in the config', () => {
    const a = getColorTheme({ hue: 200, saturation: 50, pastel: false });
    const b = getColorTheme({ pastel: false, saturation: 50, hue: 200 });

    // Two identical configs must not claim two injection slots.
    expect(a.name).toBe(b.name);
    expect(a).toBe(b);
  });

  it('names a color and its resolved seed the same', () => {
    const seed = colorThemeSeed('#0ea5e9');
    const fromColor = getColorTheme({ hue: '#0ea5e9' });
    const fromSeed = getColorTheme({
      hue: seed.hue,
      saturation: seed.saturation,
    });

    // The hash is over the RESOLVED seed, so a colour and the numbers it parses
    // to are one theme — one name, one injection, one set of rules. Hashing the
    // config as written would have given them two of each.
    expect(fromColor.name).toBe(fromSeed.name);
    expect(fromColor).toBe(fromSeed);
  });

  it('re-derives when the palette is re-seeded', () => {
    // Saturation, not `pastel`. This theme inherits the palette's saturation
    // when its own config does not pin one, so halving it moves the chroma by a
    // wide margin. `pastel` was the original lever here and it is a poor one: at
    // a near-neutral tint it shifts chroma in the 4th decimal (0.0027 → 0.0015),
    // which is close enough to round together that the assertion failed in CI
    // and could not be reproduced locally.
    setPaletteConfig({ accent: { saturation: 80 } });

    const before = getColorTheme({ hue: 200 });
    const beforeSurface = before.tokens[before.colors.surface];

    setPaletteConfig({ accent: { saturation: 10 } });

    const after = getColorTheme({ hue: 200 });

    expect(after).not.toBe(before);
    expect(after.tokens[after.colors.surface]).not.toEqual(beforeSurface);
    // A different name too: the name hashes the RESOLVED seed, and saturation is
    // part of it. Two genuinely different colours cannot share one injection
    // slot — which is the property that matters. The cost is that the pre-seed
    // slot is left behind as dead CSS, bounded by how many distinct palettes a
    // session actually uses.
    expect(after.name).not.toBe(before.name);
  });

  it('puts pastel in the name, so the two cannot share a slot', () => {
    // Asserted on the NAME rather than the values: what pastel does to a
    // near-neutral tint is too small to compare strings on reliably, but it is
    // part of the resolved seed either way.
    const plain = getColorTheme({ hue: 200, pastel: false });
    const pastel = getColorTheme({ hue: 200, pastel: true });

    expect(pastel.name).not.toBe(plain.name);
  });

  it('keeps the name stable when the palette cannot affect the seed', () => {
    const config = { hue: 200, saturation: 60, pastel: false };
    const before = getColorTheme(config);

    // `hue`, `saturation` and `pastel` are all pinned, so re-seeding the brand
    // hue cannot move this theme — and its slot is replaced, not duplicated.
    setPaletteConfig({ accent: { hue: 12 } });

    expect(getColorTheme(config).name).toBe(before.name);
  });

  it('takes extra color definitions', () => {
    const theme = getColorTheme({
      hue: 200,
      colors: { border: { base: 'surface', tone: '-20', saturation: 0.3 } },
    });

    expect(theme.colors.border).toBe(`#${theme.name}-border`);
    expect(theme.name).not.toBe(getColorTheme({ hue: 200 }).name);
  });
});

describe('colorThemeSeed', () => {
  it('reads the hue and saturation of a color', () => {
    const seed = colorThemeSeed('#0ea5e9');

    expect(seed.hue).toBeCloseTo(237.3, 0);
    expect(seed.saturation).toBeCloseTo(98.2, 0);
  });

  it('accepts every format Glaze parses', () => {
    for (const value of [
      '#0ea5e9',
      'rgb(14, 165, 233)',
      'oklch(0.7 0.14 237.3)',
      'okhsl(237.3 98% 60%)',
    ]) {
      expect(colorThemeSeed(value).hue).toBeGreaterThan(0);
    }
  });
});
