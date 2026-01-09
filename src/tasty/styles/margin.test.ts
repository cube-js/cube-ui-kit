import { marginStyle } from './margin';

describe('marginStyle', () => {
  describe('basic functionality', () => {
    it('returns empty object when no margin properties are provided', () => {
      expect(marginStyle({})).toEqual({});
    });

    it('handles boolean true value', () => {
      const result = marginStyle({ margin: true });
      expect(result).toEqual({
        margin: 'var(--gap)',
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
        margin: 'calc(2 * var(--gap))',
      });
    });

    it('handles two-value string (vertical horizontal)', () => {
      const result = marginStyle({ margin: '2x 3x' });
      expect(result).toEqual({
        margin: 'calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('handles four-value string (top right bottom left)', () => {
      const result = marginStyle({ margin: '1x 2x 3x 4x' });
      expect(result).toEqual({
        margin:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(4 * var(--gap))',
      });
    });
  });

  describe('directional margin', () => {
    it('handles directional margin - top only', () => {
      const result = marginStyle({ margin: '2x top' });
      expect(result).toEqual({
        margin: 'calc(2 * var(--gap)) 0 0 0',
      });
    });

    it('handles directional margin - left and right', () => {
      const result = marginStyle({ margin: '3x left right' });
      expect(result).toEqual({
        margin: '0 calc(3 * var(--gap))',
      });
    });

    it('handles directional margin - bottom only', () => {
      const result = marginStyle({ margin: '1x bottom' });
      expect(result).toEqual({
        margin: '0 0 var(--gap) 0',
      });
    });
  });

  describe('marginBlock and marginInline', () => {
    it('handles marginBlock (top and bottom)', () => {
      const result = marginStyle({ marginBlock: '2x' });
      expect(result).toEqual({
        margin: 'calc(2 * var(--gap)) 0',
      });
    });

    it('handles marginInline (left and right)', () => {
      const result = marginStyle({ marginInline: '4x' });
      expect(result).toEqual({
        margin: '0 calc(4 * var(--gap))',
      });
    });

    it('handles boolean and number values for logical properties', () => {
      const result = marginStyle({
        marginBlock: true,
        marginInline: 8,
      });
      expect(result).toEqual({
        margin: 'var(--gap) 8px',
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
        margin:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(4 * var(--gap))',
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
        margin: 'var(--gap) 12px calc(2 * var(--gap)) 0',
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
        margin: 'calc(2 * var(--gap)) calc(3 * var(--gap))',
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
        margin:
          'calc(4 * var(--gap)) calc(5 * var(--gap)) calc(2 * var(--gap)) calc(3 * var(--gap))',
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
        margin:
          'calc(4 * var(--gap)) calc(5 * var(--gap)) calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('example: margin="1x" marginRight="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginRight: '2x',
      });
      expect(result).toEqual({
        margin: 'var(--gap) calc(2 * var(--gap)) var(--gap) var(--gap)',
      });
    });

    it('example: margin="1x" marginBlock="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
      });
      expect(result).toEqual({
        margin: 'calc(2 * var(--gap)) var(--gap)',
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
        margin: 'calc(2 * var(--gap)) 0 0 0',
      });
    });

    it('handles zero values', () => {
      const result = marginStyle({
        margin: 0,
        marginTop: '1x',
      });
      expect(result).toEqual({
        margin: 'var(--gap) 0px 0px 0px',
      });
    });

    it('handles mixed types', () => {
      const result = marginStyle({
        margin: true,
        marginBlock: 16,
        marginLeft: '3x',
      });
      expect(result).toEqual({
        margin: '16px var(--gap) 16px calc(3 * var(--gap))',
      });
    });

    it('handles negative values', () => {
      const result = marginStyle({
        margin: '-1x',
        marginTop: -8,
      });
      expect(result).toEqual({
        margin:
          '-8px calc(-1 * var(--gap)) calc(-1 * var(--gap)) calc(-1 * var(--gap))',
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
        margin: 'calc(5 * var(--gap)) 0 calc(2 * var(--gap)) 0',
      });
    });

    it('combines directional margin with logical properties', () => {
      const result = marginStyle({
        margin: '1x top',
        marginInline: '3x',
      });
      expect(result).toEqual({
        margin: 'var(--gap) calc(3 * var(--gap)) 0 calc(3 * var(--gap))',
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
        margin: 'var(--gap) auto',
      });
    });
  });

  describe('output optimization', () => {
    it('outputs single value when all sides are equal', () => {
      expect(marginStyle({ margin: '2x' })).toEqual({
        margin: 'calc(2 * var(--gap))',
      });
      expect(marginStyle({ margin: 16 })).toEqual({
        margin: '16px',
      });
    });

    it('outputs two values when vertical and horizontal are equal', () => {
      expect(marginStyle({ margin: '1x 2x' })).toEqual({
        margin: 'var(--gap) calc(2 * var(--gap))',
      });
      expect(marginStyle({ marginBlock: '1x', marginInline: '2x' })).toEqual({
        margin: 'var(--gap) calc(2 * var(--gap))',
      });
    });

    it('outputs four values when three values differ', () => {
      expect(marginStyle({ margin: '1x 2x 3x' })).toEqual({
        margin:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(2 * var(--gap))',
      });
    });
  });
});
