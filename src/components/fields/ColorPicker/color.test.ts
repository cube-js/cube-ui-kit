import {
  ColorFormat,
  detectFormat,
  formatColor,
  fromOklch,
  maxChroma,
  parseColor,
  toHex,
  toOklch,
  toRgb,
} from './color';

describe('ColorPicker color model', () => {
  describe('parseColor', () => {
    it.each([
      ['#f00', '#ff0000'],
      ['#FF0000', '#ff0000'],
      ['#f008', '#ff0000'],
      ['#ff000080', '#ff0000'],
      ['rgb(255 0 0)', '#ff0000'],
      ['rgb(255, 0, 0)', '#ff0000'],
      ['rgba(255, 0, 0, 0.5)', '#ff0000'],
      ['rgb(255 0 0 / 50%)', '#ff0000'],
      ['rgb(100% 0% 0%)', '#ff0000'],
      ['hsl(0 100% 50%)', '#ff0000'],
      ['hsl(0deg 100% 50%)', '#ff0000'],
      ['HSL(0, 100%, 50%)', '#ff0000'],
      ['okhsl(29.23 100% 56.81%)', '#ff0000'],
      ['okhst(29.23 100% 58.59%)', '#ff0000'],
      ['oklch(0.628 0.2577 29.23)', '#ff0000'],
    ])('reads %s', (input, hex) => {
      const color = parseColor(input);

      expect(color).not.toBeNull();
      expect(toHex(color!)).toBe(hex);
    });

    it.each([
      [''],
      ['   '],
      ['red'],
      ['#ff'],
      ['#gggggg'],
      ['rgb(255 0)'],
      ['rgb(255 0 0 0 0)'],
      ['hsl(50% 100% 50%)'],
      ['oklch(0.5 0.1)'],
      ['lab(50% 20 30)'],
      ['rgb(255 0 0'],
      ['var(--color)'],
    ])('rejects %s', (input) => {
      expect(parseColor(input)).toBeNull();
    });

    it('clamps out-of-range channels', () => {
      expect(toHex(parseColor('rgb(300 -20 0)')!)).toBe('#ff0000');
      expect(toHex(parseColor('okhsl(0 500% 200%)')!)).toBe('#ffffff');
    });

    it('rejects a long digit run without backtracking', () => {
      // Guards the number pattern against polynomial backtracking: the digits
      // can only be split one way, so a long non-match fails linearly.
      const started = Date.now();

      expect(parseColor(`rgb(${'9'.repeat(40_000)}x 0 0)`)).toBeNull();
      expect(Date.now() - started).toBeLessThan(1000);
    });

    it('wraps the hue angle', () => {
      expect(parseColor('okhsl(420 100% 50%)')!.h).toBeCloseTo(60, 6);
      expect(parseColor('okhsl(-60 100% 50%)')!.h).toBeCloseTo(300, 6);
    });
  });

  describe('formatColor', () => {
    const red = parseColor('#ff0000')!;

    it.each([
      ['hex', '#ff0000'],
      ['rgb', 'rgb(255 0 0)'],
      ['hsl', 'hsl(0 100% 50%)'],
      ['okhsl', 'okhsl(29.23 100% 56.81%)'],
      ['okhst', 'okhst(29.23 100% 58.59%)'],
      ['oklch', 'oklch(0.628 0.2577 29.23)'],
    ])('writes %s', (format, expected) => {
      expect(formatColor(red, format as ColorFormat)).toBe(expected);
    });

    it('round-trips every format', () => {
      const formats: ColorFormat[] = [
        'hex',
        'rgb',
        'hsl',
        'okhsl',
        'okhst',
        'oklch',
      ];

      for (const source of ['#26fcb2', '#1a1a2e', '#ffffff', '#000000']) {
        for (const format of formats) {
          const color = parseColor(source)!;
          const text = formatColor(color, format);

          expect(toHex(parseColor(text)!), `${source} via ${format}`).toBe(
            source,
          );
        }
      }
    });

    it('zeroes the hue of achromatic colors', () => {
      // `#808080` converts with a residual hue angle that carries no meaning.
      const gray = parseColor('#808080')!;

      expect(gray.s).toBeCloseTo(0, 4);
      expect(formatColor(gray, 'okhsl')).toBe('okhsl(0 0% 53.57%)');
      expect(formatColor(gray, 'hsl')).toBe('hsl(0 0% 50.2%)');
      expect(formatColor(gray, 'oklch')).toBe('oklch(0.5999 0 0)');
    });

    it('keeps a real hue at angle zero', () => {
      // The achromatic shortcut must not swallow the hue of a saturated color
      // that simply sits at 0°.
      expect(formatColor({ h: 0, s: 1, l: 0.5 }, 'hsl')).not.toBe(
        'hsl(0 100% 50%)',
      );
    });
  });

  describe('detectFormat', () => {
    it.each([
      ['#abc', 'hex'],
      ['rgb(1 2 3)', 'rgb'],
      ['rgba(1, 2, 3, 1)', 'rgb'],
      ['hsl(1 2% 3%)', 'hsl'],
      ['okhsl(1 2% 3%)', 'okhsl'],
      ['okhst(1 2% 3%)', 'okhst'],
      ['oklch(0.1 0.2 3)', 'oklch'],
    ])('detects %s', (input, format) => {
      expect(detectFormat(input)).toBe(format);
    });

    it('returns null for text that is not a color', () => {
      expect(detectFormat('rgb(1 2)')).toBeNull();
      expect(detectFormat('hotpink')).toBeNull();
    });
  });

  describe('gamut handling', () => {
    it('clips OKLCh chroma to the sRGB gamut', () => {
      const color = fromOklch({ l: 0.8, c: 0.4, h: 200 });

      expect(color.s).toBe(1);
      expect(toOklch(color).c).toBeCloseTo(maxChroma(200, color.l), 6);
    });

    it('keeps the hue of a zero-chroma OKLCh color', () => {
      expect(fromOklch({ l: 0.5, c: 0, h: 123 }).h).toBe(123);
    });

    it('round-trips in-gamut OKLCh values', () => {
      const source = parseColor('#26fcb2')!;
      const restored = fromOklch(toOklch(source));

      expect(restored.h).toBeCloseTo(source.h, 6);
      expect(restored.s).toBeCloseTo(source.s, 6);
      expect(restored.l).toBeCloseTo(source.l, 6);
    });
  });

  describe('toRgb', () => {
    it('returns 0-255 integers', () => {
      expect(toRgb(parseColor('#26fcb2')!)).toEqual({ r: 38, g: 252, b: 178 });
    });
  });
});
