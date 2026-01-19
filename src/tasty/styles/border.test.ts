// @ts-nocheck
import { borderStyle } from './border';

describe('borderStyle', () => {
  it('returns undefined when border is not defined', () => {
    expect(borderStyle({})).toBeUndefined();
  });

  it('handles boolean true value', () => {
    const result = borderStyle({ border: true });
    // 1bw is converted to 1px by tasty parser
    expect(result.border).toContain('1px');
    expect(result.border).toContain('solid');
    expect(result.border).toContain('var(--border-color)');
  });

  it('handles simple border value', () => {
    const result = borderStyle({ border: '1bw' });
    // 1bw is converted to 1px by tasty parser
    expect(result.border).toContain('1px');
    expect(result.border).toContain('solid');
  });

  it('handles border with style', () => {
    const result = borderStyle({ border: '2bw dashed' });
    expect(result.border).toContain('2px');
    expect(result.border).toContain('dashed');
  });

  it('handles border with color', () => {
    const result = borderStyle({ border: '1bw #red' });
    expect(result.border).toContain('var(--red-color)');
  });

  it('handles border with direction', () => {
    const result = borderStyle({ border: '1bw top' });
    expect(result['border-top']).toContain('1px');
    expect(result['border-right']).toContain('0');
    expect(result['border-bottom']).toContain('0');
    expect(result['border-left']).toContain('0');
  });

  it('handles border with multiple directions', () => {
    const result = borderStyle({ border: '1bw top bottom' });
    expect(result['border-top']).toContain('1px');
    expect(result['border-bottom']).toContain('1px');
    expect(result['border-right']).toContain('0');
    expect(result['border-left']).toContain('0');
  });

  it('handles complete border definition', () => {
    const result = borderStyle({ border: '2bw dashed #purple' });
    expect(result.border).toContain('2px');
    expect(result.border).toContain('dashed');
    expect(result.border).toContain('var(--purple-color)');
  });

  // Multi-group support tests
  describe('multi-group support', () => {
    it('handles multiple groups with base and direction override', () => {
      // All sides 1bw, then top overridden to 2bw
      const result = borderStyle({ border: '1bw, 2bw top' });
      expect(result['border-top']).toContain('2px');
      expect(result['border-right']).toContain('1px');
      expect(result['border-bottom']).toContain('1px');
      expect(result['border-left']).toContain('1px');
    });

    it('handles multiple groups with different colors', () => {
      const result = borderStyle({ border: '1bw #red, 1bw #blue top' });
      expect(result['border-top']).toContain('var(--blue-color)');
      expect(result['border-right']).toContain('var(--red-color)');
      expect(result['border-bottom']).toContain('var(--red-color)');
      expect(result['border-left']).toContain('var(--red-color)');
    });

    it('handles multiple groups with different styles', () => {
      const result = borderStyle({ border: '1bw solid, dashed top bottom' });
      expect(result['border-top']).toContain('dashed');
      expect(result['border-bottom']).toContain('dashed');
      expect(result['border-right']).toContain('solid');
      expect(result['border-left']).toContain('solid');
    });

    it('handles three groups with cascading overrides', () => {
      // Base: 1bw, top/bottom: 2bw, left: 3bw
      const result = borderStyle({ border: '1bw, 2bw top bottom, 3bw left' });
      expect(result['border-top']).toContain('2px');
      expect(result['border-bottom']).toContain('2px');
      expect(result['border-right']).toContain('1px');
      expect(result['border-left']).toContain('3px');
    });

    it('later group fully overrides earlier group for same direction', () => {
      const result = borderStyle({
        border: '1bw solid #red top, 2bw dashed #blue top',
      });
      // Only top defined, should be from second group
      expect(result['border-top']).toContain('2px');
      expect(result['border-top']).toContain('dashed');
      expect(result['border-top']).toContain('var(--blue-color)');
    });

    it('maintains backward compatibility with single group all-directions', () => {
      const result = borderStyle({ border: '1bw solid #purple' });
      // Should use shorthand `border` property
      expect(result.border).toBeDefined();
      expect(result['border-top']).toBeUndefined();
    });

    it('maintains backward compatibility with single group with directions', () => {
      const result = borderStyle({ border: '1bw top left' });
      expect(result['border-top']).toContain('1px');
      expect(result['border-left']).toContain('1px');
      expect(result['border-right']).toContain('0');
      expect(result['border-bottom']).toContain('0');
    });

    it('handles all-directions override in multi-group', () => {
      // First group sets all, second group overrides all
      const result = borderStyle({ border: '1bw #red, 2bw #blue' });
      // Should use shorthand since no specific directions
      expect(result.border).toContain('2px');
      expect(result.border).toContain('var(--blue-color)');
    });
  });
});
