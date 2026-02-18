import { glaze } from './glaze';

describe('glaze', () => {
  beforeEach(() => {
    glaze.resetConfig();
  });

  describe('theme creation', () => {
    it('creates a theme with hue and saturation', () => {
      const theme = glaze(280, 80);
      expect(theme.hue).toBe(280);
      expect(theme.saturation).toBe(80);
    });

    it('creates a theme with options object', () => {
      const theme = glaze({ hue: 280, saturation: 80 });
      expect(theme.hue).toBe(280);
      expect(theme.saturation).toBe(80);
    });

    it('defaults saturation to 100 when using shorthand', () => {
      const theme = glaze(280);
      expect(theme.saturation).toBe(100);
    });
  });

  describe('color definitions', () => {
    it('resolves root colors', () => {
      const theme = glaze(280, 80);
      theme.colors({
        surface: { l: 97, sat: 0.75 },
      });

      const resolved = theme.resolve();
      const surface = resolved.get('surface')!;

      expect(surface).toBeDefined();
      expect(surface.light.h).toBe(280);
      expect(surface.light.l).toBeCloseTo(0.97, 2);
      expect(surface.light.s).toBeCloseTo(0.6, 2); // 0.75 * 80/100
    });

    it('resolves dependent colors', () => {
      const theme = glaze(280, 80);
      theme.colors({
        surface: { l: 97, sat: 0.75 },
        text: { base: 'surface', contrast: 52, minContrast: 'AAA' },
      });

      const resolved = theme.resolve();
      const text = resolved.get('text')!;

      expect(text).toBeDefined();
      // Text should be darker than surface in light mode
      expect(text.light.l).toBeLessThan(0.97);
    });

    it('replaces all colors on second .colors() call', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });
      theme.colors({ text: { l: 30 } });

      const resolved = theme.resolve();
      expect(resolved.has('surface')).toBe(false);
      expect(resolved.has('text')).toBe(true);
    });
  });

  describe('validation', () => {
    it('throws on contrast without base', () => {
      const theme = glaze(280, 80);
      theme.colors({
        text: { contrast: 52 } as any,
      });

      expect(() => theme.resolve()).toThrow('contrast');
    });

    it('throws on non-existent base reference', () => {
      const theme = glaze(280, 80);
      theme.colors({
        text: { base: 'nonexistent', contrast: 52 },
      });

      expect(() => theme.resolve()).toThrow('non-existent');
    });

    it('throws on circular base references', () => {
      const theme = glaze(280, 80);
      theme.colors({
        a: { base: 'b', contrast: 10 },
        b: { base: 'a', contrast: 10 },
      });

      expect(() => theme.resolve()).toThrow('circular');
    });

    it('throws when color has neither l nor base', () => {
      const theme = glaze(280, 80);
      theme.colors({
        text: { sat: 0.5 } as any,
      });

      expect(() => theme.resolve()).toThrow('must have either');
    });
  });

  describe('contrast sign convention', () => {
    it('auto-flips unsigned contrast when result > 100', () => {
      const theme = glaze(0, 0);
      theme.colors({
        surface: { l: 97 },
        text: { base: 'surface', contrast: 52 },
      });

      const resolved = theme.resolve();
      const text = resolved.get('text')!;
      // 97 + 52 = 149 > 100 → flips to 97 - 52 = 45
      expect(text.light.l).toBeCloseTo(0.45, 2);
    });

    it('keeps positive contrast when result <= 100', () => {
      const theme = glaze(0, 0);
      theme.colors({
        fill: { l: 52 },
        text: { base: 'fill', contrast: 48 },
      });

      const resolved = theme.resolve();
      const text = resolved.get('text')!;
      // 52 + 48 = 100 → keeps as 100
      expect(text.light.l).toBeCloseTo(1.0, 2);
    });

    it('explicit negative always means darker', () => {
      const theme = glaze(0, 0);
      theme.colors({
        surface: { l: 97 },
        text: { base: 'surface', contrast: -52 },
      });

      const resolved = theme.resolve();
      const text = resolved.get('text')!;
      // 97 - 52 = 45
      expect(text.light.l).toBeCloseTo(0.45, 2);
    });
  });

  describe('adaptation modes', () => {
    it('auto mode inverts lightness in dark scheme', () => {
      const theme = glaze(280, 80);
      theme.colors({
        surface: { l: 97, sat: 0.75 },
      });

      const resolved = theme.resolve();
      const surface = resolved.get('surface')!;

      // Light: L=97
      // Dark (auto, inverted): ((100-97) * (90-10)) / 100 + 10 = 3*0.8 + 10 = 12.4
      expect(surface.dark.l).toBeCloseTo(0.124, 2);
    });

    it('fixed mode maps lightness without inversion', () => {
      const theme = glaze(280, 80);
      theme.colors({
        fill: { l: 52, mode: 'fixed' },
      });

      const resolved = theme.resolve();
      const fill = resolved.get('fill')!;

      // Fixed: (52 * (90-10)) / 100 + 10 = 52*0.8 + 10 = 51.6
      expect(fill.dark.l).toBeCloseTo(0.516, 2);
    });

    it('static mode preserves lightness across schemes', () => {
      const theme = glaze(280, 80);
      theme.colors({
        brand: { l: 60, mode: 'static' },
      });

      const resolved = theme.resolve();
      const brand = resolved.get('brand')!;

      expect(brand.dark.l).toBeCloseTo(brand.light.l, 4);
      expect(brand.dark.s).toBeCloseTo(brand.light.s, 4);
    });
  });

  describe('dark scheme', () => {
    it('applies desaturation in dark mode', () => {
      const theme = glaze(280, 80);
      theme.colors({
        surface: { l: 97, sat: 0.75 },
      });

      const resolved = theme.resolve();
      const surface = resolved.get('surface')!;

      // Dark saturation = light_sat * (1 - 0.1)
      expect(surface.dark.s).toBeCloseTo(surface.light.s * 0.9, 2);
    });
  });

  describe('high-contrast mode', () => {
    it('uses HC pair value for lightness', () => {
      const theme = glaze(0, 0);
      theme.colors({
        surface: { l: [97, 100] },
      });

      const resolved = theme.resolve();
      const surface = resolved.get('surface')!;

      expect(surface.light.l).toBeCloseTo(0.97, 2);
      expect(surface.lightContrast.l).toBeCloseTo(1.0, 2);
    });

    it('uses HC pair value for contrast', () => {
      const theme = glaze(0, 0);
      theme.colors({
        surface: { l: 97 },
        border: { base: 'surface', contrast: [7, 20] },
      });

      const resolved = theme.resolve();
      const border = resolved.get('border')!;

      // Normal: 97 + 7 > 100 → 97 - 7 = 90
      // HC: 97 + 20 > 100 → 97 - 20 = 77
      expect(border.light.l).toBeCloseTo(0.9, 2);
      expect(border.lightContrast.l).toBeCloseTo(0.77, 2);
    });
  });

  describe('extend', () => {
    it('inherits all color definitions', () => {
      const primary = glaze(280, 80);
      primary.colors({
        surface: { l: 97, sat: 0.75 },
        text: { base: 'surface', contrast: 52, minContrast: 'AAA' },
      });

      const danger = primary.extend({ hue: 23 });
      const resolved = danger.resolve();

      expect(resolved.has('surface')).toBe(true);
      expect(resolved.has('text')).toBe(true);
      expect(resolved.get('surface')!.light.h).toBe(23);
    });

    it('can override saturation', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const muted = primary.extend({ saturation: 40 });
      expect(muted.saturation).toBe(40);
    });

    it('can override individual colors (additive merge)', () => {
      const primary = glaze(280, 80);
      primary.colors({
        surface: { l: 97 },
        fill: { l: 52 },
      });

      const danger = primary.extend({
        hue: 23,
        colors: {
          fill: { l: 48, mode: 'fixed' },
        },
      });

      const resolved = danger.resolve();
      expect(resolved.has('surface')).toBe(true);
      expect(resolved.get('fill')!.mode).toBe('fixed');
    });
  });

  describe('token export', () => {
    it('exports tokens with # prefix', () => {
      const theme = glaze(280, 80);
      theme.colors({
        surface: { l: 97 },
      });

      // Enable all modes for this test
      const tokens = theme.tokens({
        modes: { dark: true, highContrast: true },
      });
      expect(tokens['#surface']).toBeDefined();
      expect(tokens['#surface']['']).toMatch(/^okhsl\(/);
      expect(tokens['#surface']['@dark']).toMatch(/^okhsl\(/);
      expect(tokens['#surface']['@high-contrast']).toMatch(/^okhsl\(/);
      expect(tokens['#surface']['@dark & @high-contrast']).toMatch(/^okhsl\(/);
    });

    it('supports custom state aliases', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      // Enable highContrast to test HC state aliases
      const tokens = theme.tokens({
        states: { dark: '@night', highContrast: '@hc' },
        modes: { dark: true, highContrast: true },
      });

      expect(tokens['#surface']['@night']).toBeDefined();
      expect(tokens['#surface']['@hc']).toBeDefined();
      expect(tokens['#surface']['@night & @hc']).toBeDefined();
    });
  });

  describe('JSON export', () => {
    it('exports plain scheme variants', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      // Enable all modes for this test
      const json = theme.json({ modes: { dark: true, highContrast: true } });
      expect(json.surface).toBeDefined();
      expect(json.surface.light).toMatch(/^okhsl\(/);
      expect(json.surface.dark).toMatch(/^okhsl\(/);
      expect(json.surface.lightContrast).toMatch(/^okhsl\(/);
      expect(json.surface.darkContrast).toMatch(/^okhsl\(/);
    });
  });

  describe('palette', () => {
    it('combines multiple themes with prefix', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const danger = primary.extend({ hue: 23 });

      const palette = glaze.palette({ primary, danger });
      const tokens = palette.tokens({ prefix: true });

      expect(tokens['#primary-surface']).toBeDefined();
      expect(tokens['#danger-surface']).toBeDefined();
    });

    it('supports custom prefix mapping', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const danger = primary.extend({ hue: 23 });

      const palette = glaze.palette({ primary, danger });
      const tokens = palette.tokens({
        prefix: { primary: 'brand-', danger: 'error-' },
      });

      expect(tokens['#brand-surface']).toBeDefined();
      expect(tokens['#error-surface']).toBeDefined();
    });

    it('exports JSON with theme grouping', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const danger = primary.extend({ hue: 23 });

      const palette = glaze.palette({ primary, danger });
      const json = palette.json();

      expect(json.primary).toBeDefined();
      expect(json.danger).toBeDefined();
      expect(json.primary.surface.light).toMatch(/^okhsl\(/);
    });
  });

  describe('configure', () => {
    it('updates dark lightness window', () => {
      glaze.configure({ darkLightness: [5, 95] });
      const config = glaze.getConfig();
      expect(config.darkLightness).toEqual([5, 95]);
    });

    it('updates dark desaturation', () => {
      glaze.configure({ darkDesaturation: 0.2 });
      const config = glaze.getConfig();
      expect(config.darkDesaturation).toBe(0.2);
    });

    it('updates state aliases', () => {
      glaze.configure({ states: { dark: '@night' } });
      const config = glaze.getConfig();
      expect(config.states.dark).toBe('@night');
      // highContrast should keep default
      expect(config.states.highContrast).toBe('@high-contrast');
    });

    it('updates modes', () => {
      glaze.configure({ modes: { dark: false } });
      const config = glaze.getConfig();
      expect(config.modes.dark).toBe(false);
      expect(config.modes.highContrast).toBe(false); // default is false
    });
  });

  describe('output modes', () => {
    it('defaults to light + dark (2 variants) in tokens', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const tokens = theme.tokens();
      // Default: dark=true, highContrast=false → light + dark
      expect(Object.keys(tokens['#surface'])).toHaveLength(2);
    });

    it('modes: { dark: false, highContrast: true } omits dark and darkContrast from tokens', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const tokens = theme.tokens({
        modes: { dark: false, highContrast: true },
      });
      const keys = Object.keys(tokens['#surface']);
      expect(keys).toContain('');
      expect(keys).toContain('@high-contrast');
      expect(keys).toHaveLength(2);
    });

    it('modes: { highContrast: false } omits HC and darkContrast from tokens', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const tokens = theme.tokens({ modes: { highContrast: false } });
      const keys = Object.keys(tokens['#surface']);
      expect(keys).toContain('');
      expect(keys).toContain('@dark');
      expect(keys).toHaveLength(2);
    });

    it('modes: { dark: false, highContrast: false } exports light only in tokens', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const tokens = theme.tokens({
        modes: { dark: false, highContrast: false },
      });
      const keys = Object.keys(tokens['#surface']);
      expect(keys).toEqual(['']);
    });

    it('modes work on json() export', () => {
      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const json = theme.json({ modes: { highContrast: false } });
      const keys = Object.keys(json.surface);
      expect(keys).toContain('light');
      expect(keys).toContain('dark');
      expect(keys).not.toContain('lightContrast');
      expect(keys).not.toContain('darkContrast');
    });

    it('global modes config is respected', () => {
      glaze.configure({ modes: { highContrast: true } });

      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      const tokens = theme.tokens();
      // highContrast enabled → all 4 variants
      expect(Object.keys(tokens['#surface'])).toHaveLength(4);
    });

    it('per-call modes override global config', () => {
      glaze.configure({ modes: { dark: false, highContrast: false } });

      const theme = glaze(280, 80);
      theme.colors({ surface: { l: 97 } });

      // Override back to all modes
      const tokens = theme.tokens({
        modes: { dark: true, highContrast: true },
      });
      expect(Object.keys(tokens['#surface'])).toHaveLength(4);
    });

    it('modes work on palette tokens', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const palette = glaze.palette({ primary });
      const tokens = palette.tokens({
        prefix: true,
        modes: { dark: false, highContrast: false },
      });
      expect(Object.keys(tokens['#primary-surface'])).toEqual(['']);
    });

    it('modes work on palette json', () => {
      const primary = glaze(280, 80);
      primary.colors({ surface: { l: 97 } });

      const palette = glaze.palette({ primary });
      // Enable highContrast to test filtering
      const json = palette.json({ modes: { dark: false, highContrast: true } });
      const keys = Object.keys(json.primary.surface);
      expect(keys).toContain('light');
      expect(keys).toContain('lightContrast');
      expect(keys).not.toContain('dark');
      expect(keys).not.toContain('darkContrast');
    });
  });

  describe('full example from spec', () => {
    it('resolves the full example without errors', () => {
      const primary = glaze(280, 80);

      primary.colors({
        surface: { l: 97, sat: 0.75 },
        text: { base: 'surface', contrast: 52, minContrast: 'AAA' },
        border: {
          base: 'surface',
          contrast: [7, 20],
          minContrast: 'AA-large',
        },
        bg: { l: 97, sat: 0.75 },
        icon: { l: 60, sat: 0.94 },
        'btn-fill': { l: 52, mode: 'fixed' },
        'btn-text': {
          base: 'btn-fill',
          contrast: 48,
          minContrast: 'AA',
          mode: 'fixed',
        },
        disabled: { l: 81, sat: 0.4 },
      });

      const danger = primary.extend({ hue: 23 });
      const success = primary.extend({ hue: 157 });
      const warning = primary.extend({ hue: 84 });
      const note = primary.extend({ hue: 302 });

      const palette = glaze.palette({
        primary,
        danger,
        success,
        warning,
        note,
      });
      const tokens = palette.tokens({ prefix: true });

      // Verify all expected tokens exist
      expect(tokens['#primary-surface']).toBeDefined();
      expect(tokens['#primary-text']).toBeDefined();
      expect(tokens['#primary-border']).toBeDefined();
      expect(tokens['#primary-btn-fill']).toBeDefined();
      expect(tokens['#primary-btn-text']).toBeDefined();
      expect(tokens['#danger-surface']).toBeDefined();
      expect(tokens['#success-surface']).toBeDefined();
      expect(tokens['#warning-surface']).toBeDefined();
      expect(tokens['#note-surface']).toBeDefined();

      // Verify token structure (default: dark=true, highContrast=false → 2 variants)
      const surfaceToken = tokens['#primary-surface'];
      expect(Object.keys(surfaceToken)).toHaveLength(2);
      expect(surfaceToken['']).toMatch(/^okhsl\(/);
    });
  });
});
