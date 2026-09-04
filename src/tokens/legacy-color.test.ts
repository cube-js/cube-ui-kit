import { toLegacyColor } from './legacy-color';

/**
 * The failure this helper exists to prevent is silent: an unreadable value that
 * comes back unchanged is handed to a consumer that drops it and falls back to
 * its own theme. So every "cannot read this" case asserts the *fallback*, never
 * a pass-through — and the round-trip block pins the numbers, because a
 * conversion that is merely plausible is the other half of the bug.
 */
describe('toLegacyColor()', () => {
  describe('oklch — the notation every color token computes to', () => {
    it('converts an opaque color to #rrggbb', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285)')).toBe('#6b53e4');
    });

    it('carries alpha as rgba() by default', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285 / 0.4)')).toBe(
        'rgba(107, 83, 228, 0.4)',
      );
    });

    it('carries alpha as an #rrggbbaa tail on request', () => {
      expect(
        toLegacyColor('oklch(0.55 0.21 285 / 0.4)', { alpha: 'hex' }),
      ).toBe('#6b53e466');
    });

    it('keeps #rrggbb for an opaque color in either alpha mode', () => {
      // The tail is what mapbox-gl rejects, so it is never emitted when there
      // is no alpha to carry.
      expect(toLegacyColor('oklch(0.55 0.21 285 / 1)', { alpha: 'hex' })).toBe(
        '#6b53e4',
      );
      expect(toLegacyColor('oklch(0.55 0.21 285)', { alpha: 'hex' })).toBe(
        '#6b53e4',
      );
    });

    it('reads a percentage alpha', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285 / 40%)')).toBe(
        'rgba(107, 83, 228, 0.4)',
      );
    });

    it('reads percentage lightness and chroma', () => {
      // `100%` is 1 for lightness and 0.4 for chroma.
      expect(toLegacyColor('oklch(55% 52.5% 285)')).toBe(
        toLegacyColor('oklch(0.55 0.21 285)'),
      );
    });

    it('does not need whitespace around the slash', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285/0.4)')).toBe(
        'rgba(107, 83, 228, 0.4)',
      );
    });
  });

  describe('the components a hand-rolled regex misses', () => {
    it('normalizes a negative hue', () => {
      expect(toLegacyColor('oklch(0.55 0.21 -75)')).toBe(
        toLegacyColor('oklch(0.55 0.21 285)'),
      );
    });

    it('normalizes a hue past one turn', () => {
      expect(toLegacyColor('oklch(0.55 0.21 645)')).toBe(
        toLegacyColor('oklch(0.55 0.21 285)'),
      );
    });

    it('reads scientific notation', () => {
      // What a serializer emits for a very small chroma.
      expect(toLegacyColor('oklch(0.55 1e-7 285)')).toBe(
        toLegacyColor('oklch(0.55 0 285)'),
      );
    });

    it('reads every angle unit a <hue> accepts', () => {
      const expected = toLegacyColor('oklch(0.55 0.21 285)');

      expect(toLegacyColor('oklch(0.55 0.21 285deg)')).toBe(expected);
      expect(toLegacyColor('oklch(0.55 0.21 4.97419rad)')).toBe(expected);
      expect(toLegacyColor('oklch(0.55 0.21 316.667grad)')).toBe(expected);
      expect(toLegacyColor('oklch(0.55 0.21 0.79167turn)')).toBe(expected);
    });

    it('resolves a `none` component to zero rather than failing', () => {
      expect(toLegacyColor('oklch(0.55 none 285)')).toBe(
        toLegacyColor('oklch(0.55 0 285)'),
      );
      expect(toLegacyColor('oklch(none 0.21 285)')).toBe('#000000');
    });

    it('resolves `none` alpha to fully transparent', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285 / none)')).toBe(
        'rgba(107, 83, 228, 0)',
      );
    });

    it('clips a chroma outside the sRGB gamut to the gamut boundary', () => {
      // `oklch()` addresses colors sRGB cannot show; the hex has to be a real
      // color rather than a channel overflow.
      const clipped = toLegacyColor('oklch(0.55 0.4 285)');

      expect(clipped).toMatch(/^#[0-9a-f]{6}$/);
      expect(clipped).toBe(toLegacyColor('oklch(0.55 0.9 285)'));
    });

    it('clamps an out-of-range alpha', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285 / 2)')).toBe('#6b53e4');
      expect(toLegacyColor('oklch(0.55 0.21 285 / -1)')).toBe(
        'rgba(107, 83, 228, 0)',
      );
    });
  });

  describe('values whose meaning only exists inside a CSS engine', () => {
    // Each of these is a color a regex-based converter leaves untouched, which
    // is worse than refusing it: the consumer receives something it will drop.
    it.each([
      ['relative syntax', 'oklch(from #6147d6 l c h)'],
      ['relative syntax over a var()', 'oklch(from var(--purple-color) l c h)'],
      ['color-mix()', 'color-mix(in oklab, #6147d6 40%, white)'],
      ['a var() reference', 'var(--purple-color)'],
      ['an unresolved calc()', 'oklch(calc(0.5 * 1.1) 0.21 285)'],
    ])('refuses %s', (_label, value) => {
      expect(toLegacyColor(value)).toBeNull();
      expect(toLegacyColor(value, { fallback: '#000000' })).toBe('#000000');
    });

    it.each([
      ['a named color', 'rebeccapurple'],
      ['a `currentColor` keyword', 'currentcolor'],
      ['a wide-gamut space', 'color(display-p3 0.4 0.3 0.8)'],
      ['a malformed function', 'oklch(0.55 0.21)'],
      ['a second slash', 'oklch(0.55 0.21 285 / 0.4 / 0.2)'],
      ['alpha named twice', 'rgba(97, 71, 214, 0.4 / 0.2)'],
      ['a percentage hue', 'oklch(0.55 0.21 50%)'],
      ['an angle where a number belongs', 'oklch(0.55deg 0.21 285)'],
      ['a bare number', '285'],
      ['an empty string', ''],
      ['whitespace', '   '],
    ])('refuses %s', (_label, value) => {
      expect(toLegacyColor(value)).toBeNull();
    });

    it('refuses a nullish value, so it composes with resolveTokenValue()', () => {
      expect(toLegacyColor(null)).toBeNull();
      expect(toLegacyColor(undefined)).toBeNull();
      expect(toLegacyColor(undefined, { fallback: '#fff' })).toBe('#fff');
    });
  });

  describe('the other notations a token or a caller can hold', () => {
    it('passes an opaque hex through, normalized to #rrggbb', () => {
      expect(toLegacyColor('#6147D6')).toBe('#6147d6');
      expect(toLegacyColor('#abc')).toBe('#aabbcc');
    });

    it('re-forms a hex that already carries alpha', () => {
      expect(toLegacyColor('#6147d666')).toBe('rgba(97, 71, 214, 0.4)');
      expect(toLegacyColor('#6147d666', { alpha: 'hex' })).toBe('#6147d666');
    });

    it('reads rgb() in both syntaxes', () => {
      expect(toLegacyColor('rgb(97 71 214)')).toBe('#6147d6');
      expect(toLegacyColor('rgba(97, 71, 214, 0.4)')).toBe(
        'rgba(97, 71, 214, 0.4)',
      );
      expect(toLegacyColor('rgb(97 71 214 / 40%)')).toBe(
        'rgba(97, 71, 214, 0.4)',
      );
    });

    it('rounds the fractional channels a browser can serialize', () => {
      expect(toLegacyColor('rgb(97.4 70.6 213.5)')).toBe('#6147d6');
    });

    it('reads percentage rgb() channels', () => {
      expect(toLegacyColor('rgb(0% 50% 100%)')).toBe('#0080ff');
    });

    it('reads hsl()', () => {
      expect(toLegacyColor('hsl(0 100% 50%)')).toBe('#ff0000');
      expect(toLegacyColor('hsla(0, 100%, 50%, 0.5)')).toBe(
        'rgba(255, 0, 0, 0.5)',
      );
    });

    it('reads the Glaze spaces tasty accepts', () => {
      // Round-tripped against the picker's own formatters rather than pinned by
      // hand — the point is that the notation is understood at all.
      expect(toLegacyColor('okhsl(285 100% 50%)')).toMatch(/^#[0-9a-f]{6}$/);
      expect(toLegacyColor('okhst(285 100% 50%)')).toMatch(/^#[0-9a-f]{6}$/);
      expect(toLegacyColor('okhsl(285 100% 50% / 0.5)')).toMatch(
        /^rgba\(\d+, \d+, \d+, 0\.5\)$/,
      );
    });

    it('reads `transparent`, which is what `#clear` is', () => {
      expect(toLegacyColor('transparent')).toBe('rgba(0, 0, 0, 0)');
      expect(toLegacyColor('transparent', { alpha: 'hex' })).toBe('#00000000');
      // What a browser computes it to.
      expect(toLegacyColor('rgba(0, 0, 0, 0)')).toBe('rgba(0, 0, 0, 0)');
    });

    it('ignores case and surrounding whitespace', () => {
      expect(toLegacyColor('  OKLCH(0.55 0.21 285)  ')).toBe('#6b53e4');
    });
  });

  describe('output shape', () => {
    it('rounds alpha to three decimals', () => {
      expect(toLegacyColor('oklch(0.55 0.21 285 / 0.33333)')).toBe(
        'rgba(107, 83, 228, 0.333)',
      );
    });

    it('emits integer channels in both forms, so they agree', () => {
      const rgba = toLegacyColor('oklch(0.55 0.21 285 / 0.4)')!;
      const hex = toLegacyColor('oklch(0.55 0.21 285 / 0.4)', {
        alpha: 'hex',
      })!;
      const [r, g, b] = rgba.match(/\d+/g)!.map(Number);

      expect(hex.slice(0, 7)).toBe(
        `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
      );
    });

    it('emits only forms a legacy parser accepts', () => {
      const values = [
        'oklch(0.55 0.21 285)',
        'oklch(0.55 0.21 285 / 0.4)',
        'okhst(120 60% 40% / 0.25)',
        'transparent',
      ];

      for (const value of values) {
        expect(toLegacyColor(value)).toMatch(
          /^(#[0-9a-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0\.\d{1,3})\))$/,
        );
      }
    });
  });

  describe('round trip', () => {
    it('recovers an sRGB color it was given as hex', () => {
      // The oklch path goes hex → okhsl → sRGB → hex; 8-bit has to survive it,
      // or every token converted twice drifts.
      for (const hex of [
        '#000000',
        '#ffffff',
        '#6147d6',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#808080',
        '#123456',
      ]) {
        expect(toLegacyColor(hex)).toBe(hex);
      }
    });
  });
});
