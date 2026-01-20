// @ts-nocheck
import { outlineStyle } from './outline';

describe('outlineStyle', () => {
  describe('basic outline', () => {
    it('returns undefined when outline is not defined', () => {
      expect(outlineStyle({})).toBeUndefined();
    });

    it('handles boolean true value as default (uses raw 1ow = 3px)', () => {
      // Note: The default CUSTOM_UNITS has ow: '3px', so 1ow resolves to 3px
      // In production, UI-kit reconfigures this to 'var(--outline-width)'
      const result = outlineStyle({ outline: true });
      expect(result).toEqual({
        outline: '3px solid var(--outline-color)',
      });
    });

    it('handles width value', () => {
      const result = outlineStyle({ outline: '2px' });
      expect(result).toEqual({
        outline: '2px solid var(--outline-color)',
      });
    });

    it('handles width and style', () => {
      const result = outlineStyle({ outline: '2px dashed' });
      expect(result).toEqual({
        outline: '2px dashed var(--outline-color)',
      });
    });

    it('handles width, style and color', () => {
      const result = outlineStyle({ outline: '2px dashed #red' });
      expect(result).toEqual({
        outline: '2px dashed var(--red-color)',
      });
    });

    it('handles numeric 0 to remove outline', () => {
      const result = outlineStyle({ outline: 0 });
      expect(result).toEqual({
        outline: '0 solid var(--outline-color)',
      });
    });

    it('handles string "0" to remove outline', () => {
      const result = outlineStyle({ outline: '0' });
      expect(result).toEqual({
        outline: '0 solid var(--outline-color)',
      });
    });

    it('handles outline: 0 with outlineOffset', () => {
      const result = outlineStyle({ outline: 0, outlineOffset: 1 });
      expect(result).toEqual({
        outline: '0 solid var(--outline-color)',
        'outline-offset': '1px',
      });
    });

    it('handles outline: "none" style', () => {
      const result = outlineStyle({ outline: 'none' });
      expect(result).toEqual({
        outline: 'var(--outline-width) none var(--outline-color)',
      });
    });
  });

  describe('outline with offset (slash syntax)', () => {
    it('handles outline with offset', () => {
      const result = outlineStyle({ outline: '2px solid #red / 4px' });
      expect(result).toEqual({
        outline: '2px solid var(--red-color)',
        'outline-offset': '4px',
      });
    });

    it('handles width only with offset', () => {
      const result = outlineStyle({ outline: '2px / 4px' });
      expect(result).toEqual({
        outline: '2px solid var(--outline-color)',
        'outline-offset': '4px',
      });
    });

    it('handles custom unit offset', () => {
      const result = outlineStyle({ outline: '1px solid #blue / 2px' });
      expect(result).toEqual({
        outline: '1px solid var(--blue-color)',
        'outline-offset': '2px',
      });
    });

    it('handles default ow unit with offset (uses raw 1ow = 3px)', () => {
      // Note: The default CUSTOM_UNITS has ow: '3px', so 1ow resolves to 3px
      const result = outlineStyle({ outline: '1ow / 5px' });
      expect(result).toEqual({
        outline: '3px solid var(--outline-color)',
        'outline-offset': '5px',
      });
    });
  });

  describe('border styles', () => {
    it.each([
      'none',
      'hidden',
      'dotted',
      'dashed',
      'solid',
      'double',
      'groove',
      'ridge',
      'inset',
      'outset',
    ])('handles %s border style', (style) => {
      const result = outlineStyle({ outline: `2px ${style} #purple` });
      expect(result!.outline).toContain(style);
    });
  });

  describe('colors', () => {
    it('handles hash color token', () => {
      const result = outlineStyle({ outline: '2px solid #danger' });
      expect(result!.outline).toBe('2px solid var(--danger-color)');
    });

    it('uses default color when not specified', () => {
      const result = outlineStyle({ outline: '2px solid' });
      expect(result!.outline).toBe('2px solid var(--outline-color)');
    });
  });

  describe('outlineOffset prop', () => {
    it('handles outlineOffset as string', () => {
      const result = outlineStyle({ outlineOffset: '4px' });
      expect(result).toEqual({
        'outline-offset': '4px',
      });
    });

    it('handles outlineOffset as number (converts to px)', () => {
      const result = outlineStyle({ outlineOffset: 8 });
      expect(result).toEqual({
        'outline-offset': '8px',
      });
    });

    it('combines outline with outlineOffset prop', () => {
      const result = outlineStyle({
        outline: '2px solid #red',
        outlineOffset: '4px',
      });
      expect(result).toEqual({
        outline: '2px solid var(--red-color)',
        'outline-offset': '4px',
      });
    });

    it('slash syntax takes precedence over outlineOffset prop', () => {
      const result = outlineStyle({
        outline: '2px solid #red / 6px',
        outlineOffset: '4px',
      });
      expect(result).toEqual({
        outline: '2px solid var(--red-color)',
        'outline-offset': '6px', // from slash syntax, not the prop
      });
    });

    it('handles outlineOffset with custom units', () => {
      // 1x = 8px in default CUSTOM_UNITS
      const result = outlineStyle({ outlineOffset: '1x' });
      expect(result).toEqual({
        'outline-offset': '8px',
      });
    });
  });
});
