import { glaze } from '@tenphi/glaze';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { colorSeed } from './color-seed';

/** `#0ea5e9`, the reference sky blue, on the three scales `colorSeed` reports. */
const SKY = { hue: 237.32, saturation: 98.19, tone: 65.78 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('colorSeed', () => {
  it('reads hue, saturation and tone off a hex color', () => {
    const seed = colorSeed('#0ea5e9')!;

    expect(seed.hue).toBeCloseTo(SKY.hue, 1);
    expect(seed.saturation).toBeCloseTo(SKY.saturation, 1);
    expect(seed.tone).toBeCloseTo(SKY.tone, 1);
  });

  it('accepts every color syntax Glaze parses', () => {
    // The same color said six ways. Whatever notation a settings field emits — and
    // `ColorInput` can emit any of these — has to land on one seed.
    const forms = [
      '#0ea5e9',
      'rgb(14 165 233)',
      'hsl(198.63 88.66% 48.43%)',
      'okhsl(237.32 98.19% 63.36%)',
      'okhst(237.32 98.19% 65.83%)',
      'oklch(0.6847 0.1479 237.32)',
    ];

    for (const form of forms) {
      const seed = colorSeed(form)!;

      expect(seed, form).not.toBeNull();
      expect(seed.hue, form).toBeCloseTo(SKY.hue, 0);
      expect(seed.tone, form).toBeCloseTo(SKY.tone, 0);
    }
  });

  it('scales saturation and tone to 0–100, not Glaze’s 0–1', () => {
    // The palette's seeds are 0–100 and Glaze reports 0–1 factors, so a missing
    // rescale would read as a near-grey palette rather than as an error.
    const raw = glaze.color('#0ea5e9').resolve().light;
    const seed = colorSeed('#0ea5e9')!;

    expect(seed.saturation).toBeCloseTo(raw.s * 100, 6);
    expect(seed.tone).toBeCloseTo(raw.t * 100, 6);
  });

  it('returns null and warns on a color it cannot parse', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // A CSS keyword is the likely typo: it looks like a color and Glaze rejects it.
    expect(colorSeed('rebeccapurple')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/could not parse palette colour/);
  });

  it('warns once per bad value, however often it is resolved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // The failure is cached, which is what dedupes this. It matters because a bad
    // value in a `<Root palette>` literal is re-resolved on every render.
    colorSeed('not-a-color-at-all');
    colorSeed('not-a-color-at-all');
    colorSeed('not-a-color-at-all');

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('is independent of the global Glaze config', () => {
    // The whole reason this module may be imported from `palette-config.ts`: it is
    // read before `palette.ts` installs the kit's tone windows, so its answer must
    // not depend on them. A bare-string token defaults to `lightTone: false`, which
    // is what makes that true.
    const before = colorSeed('#0ea5e9')!;

    glaze.configure({ lightTone: [40, 60], darkTone: [40, 60] });

    try {
      // Past the cache, so this is a fresh resolve under the changed config.
      const after = colorSeed('rgb(14 165 233)')!;

      expect(after.hue).toBeCloseTo(before.hue, 6);
      expect(after.saturation).toBeCloseTo(before.saturation, 6);
      expect(after.tone).toBeCloseTo(before.tone, 6);
    } finally {
      glaze.configure({ lightTone: [10, 100], darkTone: [14, 95] });
    }
  });
});
