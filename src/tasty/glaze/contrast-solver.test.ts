import {
  findLightnessForContrast,
  resolveMinContrast,
} from './contrast-solver';
import {
  contrastRatioFromLuminance,
  okhslToLinearSrgb,
  relativeLuminanceFromLinearRgb,
} from './okhsl-color-math';

describe('contrast-solver', () => {
  describe('resolveMinContrast', () => {
    it('maps AA to 4.5', () => {
      expect(resolveMinContrast('AA')).toBe(4.5);
    });

    it('maps AAA to 7', () => {
      expect(resolveMinContrast('AAA')).toBe(7);
    });

    it('maps AA-large to 3', () => {
      expect(resolveMinContrast('AA-large')).toBe(3);
    });

    it('maps AAA-large to 4.5', () => {
      expect(resolveMinContrast('AAA-large')).toBe(4.5);
    });

    it('passes through numeric values', () => {
      expect(resolveMinContrast(5.5)).toBe(5.5);
    });

    it('clamps numeric values to minimum 1', () => {
      expect(resolveMinContrast(0.5)).toBe(1);
    });
  });

  describe('okhslToLinearSrgb', () => {
    it('returns black for l=0', () => {
      const [r, g, b] = okhslToLinearSrgb(0, 0, 0);
      expect(r).toBeCloseTo(0, 2);
      expect(g).toBeCloseTo(0, 2);
      expect(b).toBeCloseTo(0, 2);
    });

    it('returns white for l=1', () => {
      const [r, g, b] = okhslToLinearSrgb(0, 0, 1);
      expect(r).toBeCloseTo(1, 2);
      expect(g).toBeCloseTo(1, 2);
      expect(b).toBeCloseTo(1, 2);
    });

    it('returns mid-gray for l=0.5, s=0', () => {
      const [r, g, b] = okhslToLinearSrgb(0, 0, 0.5);
      // All channels should be equal for achromatic
      expect(r).toBeCloseTo(g, 4);
      expect(g).toBeCloseTo(b, 4);
    });
  });

  describe('relativeLuminanceFromLinearRgb', () => {
    it('returns 0 for black', () => {
      expect(relativeLuminanceFromLinearRgb([0, 0, 0])).toBe(0);
    });

    it('returns 1 for white', () => {
      expect(relativeLuminanceFromLinearRgb([1, 1, 1])).toBe(1);
    });
  });

  describe('contrastRatioFromLuminance', () => {
    it('returns 21 for black vs white', () => {
      expect(contrastRatioFromLuminance(0, 1)).toBe(21);
    });

    it('returns 1 for same luminance', () => {
      expect(contrastRatioFromLuminance(0.5, 0.5)).toBe(1);
    });

    it('is symmetric', () => {
      const a = contrastRatioFromLuminance(0.2, 0.8);
      const b = contrastRatioFromLuminance(0.8, 0.2);
      expect(a).toBe(b);
    });
  });

  describe('findLightnessForContrast', () => {
    it('returns preferred when already passing', () => {
      // White background (l=1, s=0) vs dark text
      const baseLinearRgb = okhslToLinearSrgb(0, 0, 0.97);
      const result = findLightnessForContrast({
        hue: 0,
        saturation: 0,
        preferredLightness: 0.2,
        baseLinearRgb,
        minContrast: 'AA',
      });

      // Dark text on near-white should easily pass AA
      expect(result.met).toBe(true);
      expect(result.contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('finds nearest passing lighter candidate', () => {
      // Dark background
      const baseLinearRgb = okhslToLinearSrgb(0, 0, 0.15);
      const result = findLightnessForContrast({
        hue: 0,
        saturation: 0,
        preferredLightness: 0.5,
        baseLinearRgb,
        minContrast: 'AAA',
      });

      expect(result.met).toBe(true);
      expect(result.contrast).toBeGreaterThanOrEqual(7);
    });

    it('finds nearest passing darker candidate', () => {
      // Light background
      const baseLinearRgb = okhslToLinearSrgb(0, 0, 0.95);
      const result = findLightnessForContrast({
        hue: 0,
        saturation: 0,
        preferredLightness: 0.7,
        baseLinearRgb,
        minContrast: 'AA',
      });

      expect(result.met).toBe(true);
      expect(result.contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('returns met=false when impossible', () => {
      // Very narrow range that cannot achieve high contrast
      const baseLinearRgb = okhslToLinearSrgb(0, 0, 0.5);
      const result = findLightnessForContrast({
        hue: 0,
        saturation: 0,
        preferredLightness: 0.5,
        baseLinearRgb,
        minContrast: 21, // Maximum possible contrast — only black vs white
        lightnessRange: [0.4, 0.6],
      });

      expect(result.met).toBe(false);
    });

    it('accuracy: returned candidate satisfies contrast >= target when met=true', () => {
      // Test with various hue/saturation combinations
      const testCases = [
        {
          hue: 280,
          sat: 0.8,
          baseL: 0.97,
          prefL: 0.45,
          target: 'AAA' as const,
        },
        { hue: 23, sat: 0.7, baseL: 0.15, prefL: 0.7, target: 'AA' as const },
        {
          hue: 157,
          sat: 0.6,
          baseL: 0.5,
          prefL: 0.9,
          target: 'AA-large' as const,
        },
      ];

      for (const tc of testCases) {
        const baseLinearRgb = okhslToLinearSrgb(tc.hue, tc.sat, tc.baseL);
        const result = findLightnessForContrast({
          hue: tc.hue,
          saturation: tc.sat,
          preferredLightness: tc.prefL,
          baseLinearRgb,
          minContrast: tc.target,
        });

        if (result.met) {
          // Verify independently
          const candidateLinearRgb = okhslToLinearSrgb(
            tc.hue,
            tc.sat,
            result.lightness,
          );
          const yCandidate = relativeLuminanceFromLinearRgb(candidateLinearRgb);
          const yBase = relativeLuminanceFromLinearRgb(baseLinearRgb);
          const cr = contrastRatioFromLuminance(yCandidate, yBase);

          expect(cr).toBeGreaterThanOrEqual(
            resolveMinContrast(tc.target) - 0.01,
          );
        }
      }
    });

    it('works with chromatic colors', () => {
      // Purple hue, high saturation
      const baseLinearRgb = okhslToLinearSrgb(280, 0.8, 0.97);
      const result = findLightnessForContrast({
        hue: 280,
        saturation: 0.8,
        preferredLightness: 0.45,
        baseLinearRgb,
        minContrast: 'AAA',
      });

      expect(result.met).toBe(true);
      expect(result.contrast).toBeGreaterThanOrEqual(7);
    });
  });
});
