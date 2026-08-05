import { glaze } from '@tenphi/glaze';

import { getColorTokens, renderColorTokens } from './colors';
import {
  getCodeTheme,
  getPalette,
  getPaletteTokens,
  renderPaletteTokens,
} from './palette';
import {
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
    setPaletteConfig({ pastel: true });

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

    // The code theme lives outside the palette, so it is the other easy one to
    // miss.
    expect(getCodeTheme().getConfig().pastel).toBe(true);
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

  it('drops the high-contrast tier once a manual level is set', () => {
    setPaletteConfig({ contrastLevel: 50 });

    expect(statesOf(getPaletteTokens())).toEqual(['', '@dark']);
  });

  it('reproduces the normal output at level 0', () => {
    const normal = variant(auto, '');
    const dark = variant(auto, '@dark');

    setPaletteConfig({ contrastLevel: 0 });

    const tokens = getPaletteTokens();

    expect(variant(tokens, '')).toEqual(normal);
    expect(variant(tokens, '@dark')).toEqual(dark);
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

    expect(getPaletteConfig().themes.code.saturation).toBe(
      DEFAULT_PALETTE_CONFIG.saturation,
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
    // The mirrored base must resolve to the same colour the code sits on, or the
    // AA/AAA floors would be solved against the wrong background.
    const mirrored = getCodeTheme().tokens({
      modes: { dark: true, highContrast: true },
    });
    const live = getPaletteTokens()['#surface'] as TokenStates;

    expect(mirrored.light.surface).toBe(live['']);
    expect(mirrored.dark?.surface).toBe(live['@dark']);
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

  it('collapses high contrast onto the normal variant under a manual level', () => {
    const normal = renderPaletteTokens({ contrastLevel: 40, scheme: 'light' });
    const hc = renderPaletteTokens({
      contrastLevel: 40,
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
