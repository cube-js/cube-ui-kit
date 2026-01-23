import { marginStyle } from './margin';

describe('marginStyle', () => {
  describe('basic functionality', () => {
    it('returns empty object when no margin properties are provided', () => {
      expect(marginStyle({})).toEqual({});
    });

    it('handles boolean true value', () => {
      const result = marginStyle({ margin: true });
      expect(result).toEqual({
        margin: '8px', // raw unit: 1 * 8px
      });
    });

    it('handles number value', () => {
      const result = marginStyle({ margin: 16 });
      expect(result).toEqual({
        margin: '16px',
      });
    });

    it('handles single string value', () => {
      const result = marginStyle({ margin: '2x' });
      expect(result).toEqual({
        margin: '16px', // raw unit: 2 * 8px
      });
    });

    it('handles two-value string (vertical horizontal)', () => {
      const result = marginStyle({ margin: '2x 3x' });
      expect(result).toEqual({
        margin: '16px 24px', // raw units
      });
    });

    it('handles four-value string (top right bottom left)', () => {
      const result = marginStyle({ margin: '1x 2x 3x 4x' });
      expect(result).toEqual({
        margin: '8px 16px 24px 32px', // raw units
      });
    });
  });

  describe('directional margin', () => {
    it('handles directional margin - top only', () => {
      const result = marginStyle({ margin: '2x top' });
      expect(result).toEqual({
        margin: '16px 0 0 0', // raw unit: 2 * 8px
      });
    });

    it('handles directional margin - left and right', () => {
      const result = marginStyle({ margin: '3x left right' });
      expect(result).toEqual({
        margin: '0 24px', // raw unit: 3 * 8px
      });
    });

    it('handles directional margin - bottom only', () => {
      const result = marginStyle({ margin: '1x bottom' });
      expect(result).toEqual({
        margin: '0 0 8px 0', // raw unit: 1 * 8px
      });
    });
  });

  describe('marginBlock and marginInline', () => {
    it('handles marginBlock (top and bottom)', () => {
      const result = marginStyle({ marginBlock: '2x' });
      expect(result).toEqual({
        margin: '16px 0', // raw unit: 2 * 8px
      });
    });

    it('handles marginInline (left and right)', () => {
      const result = marginStyle({ marginInline: '4x' });
      expect(result).toEqual({
        margin: '0 32px', // raw unit: 4 * 8px
      });
    });

    it('handles boolean and number values for logical properties', () => {
      const result = marginStyle({
        marginBlock: true,
        marginInline: 8,
      });
      expect(result).toEqual({
        margin: '8px', // all sides equal, optimized to single value
      });
    });
  });

  describe('individual direction properties', () => {
    it('handles individual direction properties', () => {
      const result = marginStyle({
        marginTop: '1x',
        marginRight: '2x',
        marginBottom: '3x',
        marginLeft: '4x',
      });
      expect(result).toEqual({
        margin: '8px 16px 24px 32px', // raw units
      });
    });

    it('handles boolean and number values for individual directions', () => {
      const result = marginStyle({
        marginTop: true,
        marginRight: 12,
        marginBottom: '2x',
        marginLeft: false,
      });
      expect(result).toEqual({
        margin: '8px 12px 16px 0', // raw units
      });
    });
  });

  describe('priority system', () => {
    it('margin (low) < marginBlock/marginInline (medium)', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
        marginInline: '3x',
      });
      expect(result).toEqual({
        margin: '16px 24px', // raw units
      });
    });

    it('marginBlock/marginInline (medium) < individual directions (high)', () => {
      const result = marginStyle({
        marginBlock: '2x',
        marginInline: '3x',
        marginTop: '4x',
        marginRight: '5x',
      });
      expect(result).toEqual({
        margin: '32px 40px 16px 24px', // raw units
      });
    });

    it('complete priority chain: margin < marginBlock/Inline < individual', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
        marginInline: '3x',
        marginTop: '4x',
        marginRight: '5x',
      });
      expect(result).toEqual({
        margin: '32px 40px 16px 24px', // raw units
      });
    });

    it('example: margin="1x" marginRight="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginRight: '2x',
      });
      expect(result).toEqual({
        margin: '8px 16px 8px 8px', // raw units
      });
    });

    it('example: margin="1x" marginBlock="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
      });
      expect(result).toEqual({
        margin: '16px 8px', // raw units
      });
    });
  });

  describe('edge cases', () => {
    it('handles null and undefined values', () => {
      const result = marginStyle({
        margin: undefined,
        marginBlock: undefined,
        marginTop: undefined,
      });
      expect(result).toEqual({});
    });

    it('handles empty string values', () => {
      const result = marginStyle({
        margin: '',
        marginBlock: '',
        marginTop: '2x',
      });
      expect(result).toEqual({
        margin: '16px 0 0 0', // raw unit: 2 * 8px
      });
    });

    it('handles zero values', () => {
      const result = marginStyle({
        margin: 0,
        marginTop: '1x',
      });
      expect(result).toEqual({
        margin: '8px 0px 0px 0px', // raw unit: 1 * 8px
      });
    });

    it('handles mixed types', () => {
      const result = marginStyle({
        margin: true,
        marginBlock: 16,
        marginLeft: '3x',
      });
      expect(result).toEqual({
        margin: '16px 8px 16px 24px', // raw units
      });
    });

    it('handles negative values', () => {
      const result = marginStyle({
        margin: '-1x',
        marginTop: -8,
      });
      expect(result).toEqual({
        margin: '-8px', // all sides equal, optimized to single value
      });
    });
  });

  describe('directional margin with priority', () => {
    it('respects individual directions over directional margin', () => {
      const result = marginStyle({
        margin: '2x top bottom',
        marginTop: '5x',
      });
      expect(result).toEqual({
        margin: '40px 0 16px 0', // raw units
      });
    });

    it('combines directional margin with logical properties', () => {
      const result = marginStyle({
        margin: '1x top',
        marginInline: '3x',
      });
      expect(result).toEqual({
        margin: '8px 24px 0 24px', // raw units
      });
    });

    it('assigns values to directions in order they appear', () => {
      // First value (1x) → first direction (right), second value (2x) → second direction (top)
      expect(marginStyle({ margin: 'right 1x top 2x' })).toEqual({
        margin: '16px 8px 0 0',
      });

      expect(marginStyle({ margin: 'left 2x right 1x' })).toEqual({
        margin: '0 8px 0 16px',
      });
    });
  });

  describe('auto values', () => {
    it('handles auto values for centering', () => {
      const result = marginStyle({
        marginInline: 'auto',
      });
      expect(result).toEqual({
        margin: '0 auto',
      });
    });

    it('handles mixed auto and specific values', () => {
      const result = marginStyle({
        margin: '1x auto',
      });
      expect(result).toEqual({
        margin: '8px auto', // raw unit: 1 * 8px
      });
    });
  });

  describe('output optimization', () => {
    it('outputs single value when all sides are equal', () => {
      expect(marginStyle({ margin: '2x' })).toEqual({
        margin: '16px', // raw unit: 2 * 8px
      });
      expect(marginStyle({ margin: 16 })).toEqual({
        margin: '16px',
      });
    });

    it('outputs two values when vertical and horizontal are equal', () => {
      expect(marginStyle({ margin: '1x 2x' })).toEqual({
        margin: '8px 16px', // raw units
      });
      expect(marginStyle({ marginBlock: '1x', marginInline: '2x' })).toEqual({
        margin: '8px 16px', // raw units
      });
    });

    it('outputs four values when three values differ', () => {
      expect(marginStyle({ margin: '1x 2x 3x' })).toEqual({
        margin: '8px 16px 24px 16px', // raw units
      });
    });
  });
});
