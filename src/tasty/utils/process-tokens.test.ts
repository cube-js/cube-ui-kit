import { processTokens } from './process-tokens';

describe('processTokens', () => {
  describe('HSL color token processing', () => {
    // Expected values calculated using CSS Color 4 spec algorithm
    // Reference: https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
    // Same algorithm used in @texel/color test/spaces/hsl.js

    it('converts HSL with space-separated values to RGB triplet', () => {
      const result = processTokens({
        '#primary': 'hsl(200 40% 50%)',
      });

      expect(result).toBeDefined();
      expect(result!['--primary-color']).toBe('hsl(200 40% 50%)');
      // hsl(200 40% 50%) = rgb(76.5 144.5 178.5)
      expect(result!['--primary-color-rgb']).toBe('76.5 144.5 178.5');
    });

    it('converts HSL with comma-separated values to RGB triplet', () => {
      const result = processTokens({
        '#accent': 'hsl(120, 50%, 50%)',
      });

      expect(result).toBeDefined();
      // Parser normalizes the spacing, just check it starts with hsl
      expect(result!['--accent-color']).toMatch(/^hsl\(120/);
      // hsl(120 50% 50%) = rgb(63.8 191.3 63.8)
      expect(result!['--accent-color-rgb']).toBe('63.8 191.3 63.8');
    });

    it('converts pure red HSL correctly', () => {
      const result = processTokens({
        '#red': 'hsl(0 100% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(0 100% 50%) = rgb(255 0 0)
      expect(result!['--red-color-rgb']).toBe('255 0 0');
    });

    it('converts pure green HSL correctly', () => {
      const result = processTokens({
        '#green': 'hsl(120 100% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(120 100% 50%) = rgb(0 255 0)
      expect(result!['--green-color-rgb']).toBe('0 255 0');
    });

    it('converts pure blue HSL correctly', () => {
      const result = processTokens({
        '#blue': 'hsl(240 100% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(240 100% 50%) = rgb(0 0 255)
      expect(result!['--blue-color-rgb']).toBe('0 0 255');
    });

    it('converts white HSL correctly', () => {
      const result = processTokens({
        '#white': 'hsl(0 0% 100%)',
      });

      expect(result).toBeDefined();
      // hsl(0 0% 100%) = rgb(255 255 255)
      expect(result!['--white-color-rgb']).toBe('255 255 255');
    });

    it('converts black HSL correctly', () => {
      const result = processTokens({
        '#black': 'hsl(0 0% 0%)',
      });

      expect(result).toBeDefined();
      // hsl(0 0% 0%) = rgb(0 0 0)
      expect(result!['--black-color-rgb']).toBe('0 0 0');
    });

    it('converts gray HSL correctly (saturation = 0)', () => {
      const result = processTokens({
        '#gray': 'hsl(180 0% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(180 0% 50%) = rgb(127.5 127.5 127.5)
      expect(result!['--gray-color-rgb']).toBe('127.5 127.5 127.5');
    });

    it('converts cyan HSL correctly', () => {
      const result = processTokens({
        '#cyan': 'hsl(180 100% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(180 100% 50%) = rgb(0 255 255)
      expect(result!['--cyan-color-rgb']).toBe('0 255 255');
    });

    it('converts yellow-green HSL correctly', () => {
      const result = processTokens({
        '#yellowgreen': 'hsl(90 50% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(90 50% 50%) = rgb(127.5 191.3 63.8)
      expect(result!['--yellowgreen-color-rgb']).toBe('127.5 191.3 63.8');
    });

    it('handles HSLA syntax (ignores alpha for rgb output)', () => {
      const result = processTokens({
        '#transparent': 'hsla(200 40% 50% / 0.5)',
      });

      expect(result).toBeDefined();
      expect(result!['--transparent-color']).toBe('hsla(200 40% 50% / 0.5)');
      // hsla(200 40% 50% / 0.5) -> rgb values same as hsl(200 40% 50%)
      expect(result!['--transparent-color-rgb']).toBe('76.5 144.5 178.5');
    });

    it('handles hue with deg unit', () => {
      const result = processTokens({
        '#color': 'hsl(90deg 50% 50%)',
      });

      expect(result).toBeDefined();
      // hsl(90deg 50% 50%) = hsl(90 50% 50%) = rgb(127.5 191.3 63.8)
      expect(result!['--color-color-rgb']).toBe('127.5 191.3 63.8');
    });

    it('handles hue with turn unit', () => {
      const result = processTokens({
        '#color': 'hsl(0.5turn 100% 50%)',
      });

      expect(result).toBeDefined();
      // 0.5turn = 180deg = cyan = rgb(0 255 255)
      expect(result!['--color-color-rgb']).toBe('0 255 255');
    });

    it('handles hue with rad unit', () => {
      const result = processTokens({
        '#color': 'hsl(3.14159rad 100% 50%)',
      });

      expect(result).toBeDefined();
      // π rad ≈ 180deg = cyan = rgb(0 255 255)
      expect(result!['--color-color-rgb']).toBe('0 255 255');
    });

    it('handles negative hue values', () => {
      const result1 = processTokens({ '#neg': 'hsl(-90 100% 50%)' });
      const result2 = processTokens({ '#pos': 'hsl(270 100% 50%)' });

      // -90deg should equal 270deg (violet)
      expect(result1!['--neg-color-rgb']).toBe(result2!['--pos-color-rgb']);
      expect(result1!['--neg-color-rgb']).toBe('127.5 0 255');
    });

    it('handles hue > 360', () => {
      const result1 = processTokens({ '#over': 'hsl(450 100% 50%)' });
      const result2 = processTokens({ '#norm': 'hsl(90 100% 50%)' });

      // 450deg should equal 90deg (yellow-green)
      expect(result1!['--over-color-rgb']).toBe(result2!['--norm-color-rgb']);
      expect(result1!['--over-color-rgb']).toBe('127.5 255 0');
    });
  });

  describe('hex color token processing', () => {
    it('converts hex to RGB triplet', () => {
      const result = processTokens({
        '#primary': '#ff8040',
      });

      expect(result).toBeDefined();
      expect(result!['--primary-color-rgb']).toBe('255 128 64');
    });

    it('converts short hex to RGB triplet', () => {
      const result = processTokens({
        '#primary': '#f80',
      });

      expect(result).toBeDefined();
      expect(result!['--primary-color-rgb']).toBe('255 136 0');
    });
  });

  describe('rgb color token processing', () => {
    it('extracts RGB values from rgb() syntax', () => {
      const result = processTokens({
        '#primary': 'rgb(100 150 200)',
      });

      expect(result).toBeDefined();
      expect(result!['--primary-color-rgb']).toBe('100 150 200');
    });
  });

  describe('OKHSL color token processing', () => {
    it('converts OKHSL to RGB triplet', () => {
      const result = processTokens({
        '#purple': 'okhsl(280.3 80% 52%)',
      });

      expect(result).toBeDefined();
      expect(result!['--purple-color']).toBe('okhsl(280.3 80% 52%)');
      // Should be RGB triplet, not the OKHSL string
      expect(result!['--purple-color-rgb']).toMatch(
        /^\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/,
      );
      // Should NOT be the OKHSL string
      expect(result!['--purple-color-rgb']).not.toContain('okhsl');
    });

    it('converts OKHSL with alpha to RGB triplet', () => {
      const result = processTokens({
        '#custom': 'okhsl(280.3 80% 52% / 0.5)',
      });

      expect(result).toBeDefined();
      // Alpha should be ignored for RGB triplet
      expect(result!['--custom-color-rgb']).toMatch(
        /^\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/,
      );
      expect(result!['--custom-color-rgb']).not.toContain('okhsl');
    });

    it('converts white OKHSL correctly', () => {
      const result = processTokens({
        '#white': 'okhsl(0 0% 100%)',
      });

      expect(result).toBeDefined();
      expect(result!['--white-color-rgb']).toBe('255 255 255');
    });

    it('converts black OKHSL correctly', () => {
      const result = processTokens({
        '#black': 'okhsl(0 0% 0%)',
      });

      expect(result).toBeDefined();
      expect(result!['--black-color-rgb']).toBe('0 0 0');
    });
  });

  describe('custom property tokens', () => {
    it('processes $ tokens correctly', () => {
      const result = processTokens({
        $gap: '16px',
      });

      expect(result).toBeDefined();
      expect(result!['--gap']).toBe('16px');
    });
  });

  describe('edge cases', () => {
    it('returns undefined for empty tokens', () => {
      expect(processTokens({})).toBeUndefined();
    });

    it('returns undefined for undefined tokens', () => {
      expect(processTokens(undefined)).toBeUndefined();
    });

    it('skips null and undefined values', () => {
      const result = processTokens({
        '#valid': 'hsl(200 50% 50%)',
        '#invalid': undefined as any,
      });

      expect(result).toBeDefined();
      expect(result!['--valid-color']).toBeDefined();
      expect(result!['--invalid-color']).toBeUndefined();
    });
  });
});
