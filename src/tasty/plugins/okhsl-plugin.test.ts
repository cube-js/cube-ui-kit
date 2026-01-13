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

    // Expected values calculated using @texel/color library:
    // OKHSLToOKLab() + convert(OKLab, sRGB)

    describe('angle parsing', () => {
      it('parses unitless angles as degrees', () => {
        const result = parser.process('okhsl(0 50% 50%)');
        // okhsl(0 50% 50%) = rgb(66.7% 35.1% 45.6%)
        expect(result.output).toBe('rgb(66.7% 35.1% 45.6%)');
      });

      it('parses deg unit', () => {
        const result = parser.process('okhsl(180deg 50% 50%)');
        // okhsl(180 50% 50%) = rgb(27.9% 51.8% 47.2%)
        expect(result.output).toBe('rgb(27.9% 51.8% 47.2%)');
      });

      it('parses turn unit', () => {
        // 0.5turn = 180deg
        const result = parser.process('okhsl(0.5turn 50% 50%)');
        // okhsl(180 50% 50%) = rgb(27.9% 51.8% 47.2%)
        expect(result.output).toBe('rgb(27.9% 51.8% 47.2%)');
      });

      it('parses rad unit', () => {
        // π rad = 180deg
        const result = parser.process('okhsl(3.14159rad 50% 50%)');
        // okhsl(180 50% 50%) = rgb(27.9% 51.8% 47.2%)
        expect(result.output).toBe('rgb(27.9% 51.8% 47.2%)');
      });
    });

    describe('color conversion', () => {
      it('converts pure red (hue ~29)', () => {
        // OKHSL red at full saturation and ~56.82% lightness = sRGB pure red
        const result = parser.process('okhsl(29.23deg 100% 56.82%)');
        // okhsl(29.23 100% 56.82%) = rgb(100% 0.2% 0.1%)
        expect(result.output).toBe('rgb(100% 0.2% 0.1%)');
      });

      it('converts a greenish color (hue ~142)', () => {
        // OKHSL green at full saturation and ~51.98% lightness
        const result = parser.process('okhsl(142.5deg 100% 51.98%)');
        // okhsl(142.5 100% 51.98%) = rgb(0% 59.2% 0.1%)
        expect(result.output).toBe('rgb(0% 59.2% 0.1%)');
      });

      it('converts a bluish color (hue ~264)', () => {
        // OKHSL blue at full saturation and ~45.2% lightness
        const result = parser.process('okhsl(264.06deg 100% 45.2%)');
        // okhsl(264.06 100% 45.2%) = rgb(7.6% 31.3% 100%)
        expect(result.output).toBe('rgb(7.6% 31.3% 100%)');
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
        // okhsl(180 0% 50%) = rgb(46.6% 46.6% 46.6%)
        expect(result.output).toBe('rgb(46.6% 46.6% 46.6%)');
      });
    });

    describe('percentage parsing', () => {
      it('handles percentage notation for S and L', () => {
        const result = parser.process('okhsl(0 100% 50%)');
        // okhsl(0 100% 50%) = rgb(84.2% 0% 44.5%)
        expect(result.output).toBe('rgb(84.2% 0% 44.5%)');
      });

      it('handles decimal values without percent', () => {
        // 0 1 0.5 is the same as 0 100% 50%
        const result = parser.process('okhsl(0 1 0.5)');
        // okhsl(0 100% 50%) = rgb(84.2% 0% 44.5%)
        expect(result.output).toBe('rgb(84.2% 0% 44.5%)');
      });
    });

    describe('edge cases', () => {
      it('clamps saturation above 100%', () => {
        const result = parser.process('okhsl(0 150% 50%)');
        // Saturation clamped to 100%, same as okhsl(0 100% 50%)
        expect(result.output).toBe('rgb(84.2% 0% 44.5%)');
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
        // okhsl(270 50% 50%) = rgb(37.4% 45.2% 70.5%)
        expect(resultNeg.output).toBe(resultPos.output);
        expect(resultNeg.output).toBe('rgb(37.4% 45.2% 70.5%)');
      });

      it('handles hue > 360 (wraps around)', () => {
        // 450deg should equal 90deg
        const resultOver = parser.process('okhsl(450deg 50% 50%)');
        const resultNorm = parser.process('okhsl(90deg 50% 50%)');
        // okhsl(90 50% 50%) = rgb(53.3% 46% 26%)
        expect(resultOver.output).toBe(resultNorm.output);
        expect(resultOver.output).toBe('rgb(53.3% 46% 26%)');
      });

      it('returns fallback for missing values', () => {
        // Silence expected warning
        const warnSpy = jest
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        // Directly test okhslFunc with empty groups
        const result = okhslFunc([]);
        expect(result).toBe('rgb(0% 0% 0%)');
        expect(warnSpy).toHaveBeenCalledWith(
          '[okhsl] Expected 3 values (H S L), got:',
          [],
        );

        warnSpy.mockRestore();
      });
    });

    describe('output format', () => {
      it('outputs rgb() with percentage syntax', () => {
        const result = parser.process('okhsl(200 60% 40%)');
        // okhsl(200 60% 40%) = rgb(17.2% 41.1% 42.3%)
        expect(result.output).toBe('rgb(17.2% 41.1% 42.3%)');
      });
    });
  });
});
