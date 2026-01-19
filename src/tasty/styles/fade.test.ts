// @ts-nocheck
import { fadeStyle } from './fade';

describe('fadeStyle', () => {
  it('returns undefined when fade is not defined', () => {
    expect(fadeStyle({})).toBeUndefined();
  });

  it('returns undefined for falsy values', () => {
    expect(fadeStyle({ fade: '' })).toBeUndefined();
    expect(fadeStyle({ fade: null })).toBeUndefined();
    expect(fadeStyle({ fade: undefined })).toBeUndefined();
  });

  it('applies default fade to all edges with default width', () => {
    const result = fadeStyle({ fade: true });
    expect(result.mask).toContain('to bottom');
    expect(result.mask).toContain('to left');
    expect(result.mask).toContain('to top');
    expect(result.mask).toContain('to right');
    expect(result.mask).toContain('var(--fade-width)');
    expect(result['mask-composite']).toBe('intersect');
  });

  it('applies fade to specific direction', () => {
    const result = fadeStyle({ fade: 'top' });
    expect(result.mask).toBe(
      'linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 1) var(--fade-width))',
    );
  });

  it('applies fade with custom width', () => {
    const result = fadeStyle({ fade: '2x top' });
    // 2x is converted to 16px by tasty parser
    expect(result.mask).toBe(
      'linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 1) 16px)',
    );
  });

  it('applies fade to multiple directions', () => {
    const result = fadeStyle({ fade: 'left right' });
    expect(result.mask).toContain('to right');
    expect(result.mask).toContain('to left');
    expect(result.mask).not.toContain('to top');
    expect(result.mask).not.toContain('to bottom');
  });

  it('handles custom transparent color only', () => {
    const result = fadeStyle({ fade: 'top #transparent-mask' });
    expect(result.mask).toBe(
      'linear-gradient(to bottom, var(--transparent-mask-color) 0%, rgb(0 0 0 / 1) var(--fade-width))',
    );
  });

  it('handles both custom colors', () => {
    const result = fadeStyle({ fade: 'top #clear #solid' });
    expect(result.mask).toBe(
      'linear-gradient(to bottom, var(--clear-color) 0%, var(--solid-color) var(--fade-width))',
    );
  });

  it('handles colors with custom width', () => {
    const result = fadeStyle({ fade: '2x top #fade-start #fade-end' });
    // 2x is converted to 16px by tasty parser
    expect(result.mask).toBe(
      'linear-gradient(to bottom, var(--fade-start-color) 0%, var(--fade-end-color) 16px)',
    );
  });

  it('applies custom colors to all edges', () => {
    const result = fadeStyle({ fade: '#transparent #opaque' });
    expect(result.mask).toContain('var(--transparent-color) 0%');
    expect(result.mask).toContain('var(--opaque-color)');
    // Should have 4 gradients (one for each edge)
    const gradientCount = (result.mask.match(/linear-gradient/g) || []).length;
    expect(gradientCount).toBe(4);
  });

  it('applies different widths per direction', () => {
    const result = fadeStyle({ fade: '3x 1x top bottom' });
    // top should use 3x (24px), bottom should use 1x (8px)
    expect(result.mask).toContain('rgb(0 0 0 / 1) 24px');
    expect(result.mask).toContain('rgb(0 0 0 / 1) 8px');
  });

  // Multi-group support tests
  describe('multi-group support', () => {
    it('handles multiple groups with different directions and colors', () => {
      const result = fadeStyle({
        fade: 'top #red #blue, bottom #green #yellow',
      });
      // Should have 2 gradients (one for top, one for bottom)
      const gradientCount = (result.mask.match(/linear-gradient/g) || [])
        .length;
      expect(gradientCount).toBe(2);
      // Top edge gradient
      expect(result.mask).toContain(
        'linear-gradient(to bottom, var(--red-color) 0%, var(--blue-color)',
      );
      // Bottom edge gradient
      expect(result.mask).toContain(
        'linear-gradient(to top, var(--green-color) 0%, var(--yellow-color)',
      );
    });

    it('handles multiple groups with different widths', () => {
      const result = fadeStyle({ fade: '2x top, 1x bottom' });
      // 2x = 16px, 1x = 8px
      expect(result.mask).toContain('to bottom');
      expect(result.mask).toContain('16px');
      expect(result.mask).toContain('to top');
      expect(result.mask).toContain('8px');
    });

    it('handles multiple groups with different widths and colors', () => {
      const result = fadeStyle({
        fade: '2x top #a #b, 1x bottom #c #d',
      });
      expect(result.mask).toContain(
        'linear-gradient(to bottom, var(--a-color) 0%, var(--b-color) 16px)',
      );
      expect(result.mask).toContain(
        'linear-gradient(to top, var(--c-color) 0%, var(--d-color) 8px)',
      );
    });

    it('handles multiple directions in a single group within multi-group', () => {
      const result = fadeStyle({
        fade: 'left right #red #blue, top bottom #green #yellow',
      });
      const gradientCount = (result.mask.match(/linear-gradient/g) || [])
        .length;
      expect(gradientCount).toBe(4);
      // Left and right with red/blue
      expect(result.mask).toContain('to right, var(--red-color)');
      expect(result.mask).toContain('to left, var(--red-color)');
      // Top and bottom with green/yellow
      expect(result.mask).toContain('to bottom, var(--green-color)');
      expect(result.mask).toContain('to top, var(--green-color)');
    });

    it('maintains backward compatibility with single group', () => {
      // These should all work the same as before
      const result1 = fadeStyle({ fade: 'top' });
      expect(result1.mask).toContain('to bottom');

      const result2 = fadeStyle({ fade: '2x' });
      const gradientCount = (result2.mask.match(/linear-gradient/g) || [])
        .length;
      expect(gradientCount).toBe(4); // All 4 edges

      const result3 = fadeStyle({ fade: '#red #blue' });
      expect(result3.mask).toContain('var(--red-color)');
      expect(result3.mask).toContain('var(--blue-color)');
    });
  });
});
