import { StyleParser } from '../parser/parser';

import { okhslFunc, okhslPlugin } from './okhsl-plugin';

describe('okhslPlugin', () => {
  describe('plugin factory', () => {
    it('returns a valid TastyPlugin', () => {
      const plugin = okhslPlugin();
      expect(plugin.name).toBe('okhsl');
      expect(plugin.funcs).toBeDefined();
      expect(plugin.funcs?.okhsl).toBe(okhslFunc);
    });
  });

  describe('okhslFunc', () => {
    const parser = new StyleParser({
      funcs: { okhsl: okhslFunc },
    });

    describe('angle parsing', () => {
      it('parses unitless angles as degrees', () => {
        const result = parser.process('okhsl(0 50% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });

      it('parses deg unit', () => {
        const result = parser.process('okhsl(180deg 50% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });

      it('parses turn unit', () => {
        // 0.5turn = 180deg
        const result = parser.process('okhsl(0.5turn 50% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });

      it('parses rad unit', () => {
        // π rad = 180deg
        const result = parser.process('okhsl(3.14159rad 50% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });
    });

    describe('color conversion', () => {
      it('converts pure red (hue 0)', () => {
        // OKHSL red at full saturation and ~63% lightness should be close to pure red
        const result = parser.process('okhsl(29.23deg 100% 56.82%)');
        expect(result.output).toMatch(/^rgb\(/);
        // Extract RGB values
        const match = result.output.match(
          /rgb\(([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)%\)/,
        );
        expect(match).toBeTruthy();
        if (match) {
          const [, r, g, b] = match;
          // Should be close to red (100%, 0%, 0%)
          expect(parseFloat(r)).toBeGreaterThan(90);
          expect(parseFloat(g)).toBeLessThan(10);
          expect(parseFloat(b)).toBeLessThan(10);
        }
      });

      it('converts a greenish color (hue ~142)', () => {
        // OKHSL green-ish - note that OKHSL green is not exactly sRGB green
        const result = parser.process('okhsl(142.5deg 100% 51.98%)');
        expect(result.output).toMatch(/^rgb\(/);
        const match = result.output.match(
          /rgb\(([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)%\)/,
        );
        expect(match).toBeTruthy();
        if (match) {
          const [, r, g, b] = match;
          // Green channel should be dominant
          expect(parseFloat(g)).toBeGreaterThan(parseFloat(r));
          expect(parseFloat(g)).toBeGreaterThan(parseFloat(b));
        }
      });

      it('converts a bluish color (hue ~264)', () => {
        // OKHSL blue-ish - note that OKHSL blue is not exactly sRGB blue
        const result = parser.process('okhsl(264.06deg 100% 45.2%)');
        expect(result.output).toMatch(/^rgb\(/);
        const match = result.output.match(
          /rgb\(([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)%\)/,
        );
        expect(match).toBeTruthy();
        if (match) {
          const [, r, g, b] = match;
          // Blue channel should be dominant
          expect(parseFloat(b)).toBeGreaterThan(parseFloat(r));
          expect(parseFloat(b)).toBeGreaterThan(parseFloat(g));
        }
      });

      it('converts black (L=0)', () => {
        const result = parser.process('okhsl(0 0% 0%)');
        expect(result.output).toBe('rgb(0% 0% 0%)');
      });

      it('converts white (L=100%)', () => {
        const result = parser.process('okhsl(0 0% 100%)');
        expect(result.output).toBe('rgb(100% 100% 100%)');
      });

      it('converts gray (S=0)', () => {
        // With zero saturation, hue is irrelevant
        const result = parser.process('okhsl(180 0% 50%)');
        const match = result.output.match(
          /rgb\(([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)%\)/,
        );
        expect(match).toBeTruthy();
        if (match) {
          const [, r, g, b] = match;
          // All channels should be equal for gray
          expect(Math.abs(parseFloat(r) - parseFloat(g))).toBeLessThan(1);
          expect(Math.abs(parseFloat(g) - parseFloat(b))).toBeLessThan(1);
        }
      });
    });

    describe('percentage parsing', () => {
      it('handles percentage notation for S and L', () => {
        const result = parser.process('okhsl(0 100% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });

      it('handles decimal values without percent', () => {
        // This is less common but should work
        const result = parser.process('okhsl(0 1 0.5)');
        expect(result.output).toMatch(/^rgb\(/);
      });
    });

    describe('edge cases', () => {
      it('clamps saturation above 100%', () => {
        const result = parser.process('okhsl(0 150% 50%)');
        expect(result.output).toMatch(/^rgb\(/);
      });

      it('clamps lightness above 100%', () => {
        const result = parser.process('okhsl(0 50% 150%)');
        // Should clamp to white
        expect(result.output).toBe('rgb(100% 100% 100%)');
      });

      it('handles negative hue (wraps around)', () => {
        // -90deg should equal 270deg
        const resultNeg = parser.process('okhsl(-90deg 50% 50%)');
        const resultPos = parser.process('okhsl(270deg 50% 50%)');
        expect(resultNeg.output).toBe(resultPos.output);
      });

      it('handles hue > 360 (wraps around)', () => {
        // 450deg should equal 90deg
        const resultOver = parser.process('okhsl(450deg 50% 50%)');
        const resultNorm = parser.process('okhsl(90deg 50% 50%)');
        expect(resultOver.output).toBe(resultNorm.output);
      });

      it('returns fallback for missing values', () => {
        // Directly test okhslFunc with empty groups
        const result = okhslFunc([]);
        expect(result).toBe('rgb(0% 0% 0%)');
      });
    });

    describe('output format', () => {
      it('outputs rgb() with percentage syntax', () => {
        const result = parser.process('okhsl(200 60% 40%)');
        // Should match pattern: rgb(N% N% N%) where N is a number with optional decimals
        expect(result.output).toMatch(
          /^rgb\(\d+(?:\.\d+)?% \d+(?:\.\d+)?% \d+(?:\.\d+)?%\)$/,
        );
        // Verify no trailing zeros (e.g., no "10.0%" or "100.0%")
        expect(result.output).not.toMatch(/\.0+%/);
      });
    });
  });
});
