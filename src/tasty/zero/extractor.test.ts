import {
  extractKeyframesFromStyles,
  extractStylesWithChunks,
} from './extractor';

describe('extractStylesWithChunks', () => {
  it('should generate deterministic className from content', () => {
    const styles = { display: 'block', color: 'red' };
    const chunks1 = extractStylesWithChunks(styles);
    const chunks2 = extractStylesWithChunks(styles);

    expect(chunks1).toEqual(chunks2);
    expect(chunks1[0].className).toMatch(/^ts[a-f0-9]{6}$/);
  });

  it('should generate same className for same styles', () => {
    const styles1 = { display: 'block', color: 'red' };
    const styles2 = { display: 'block', color: 'red' };

    const chunks1 = extractStylesWithChunks(styles1);
    const chunks2 = extractStylesWithChunks(styles2);

    expect(chunks1[0].className).toBe(chunks2[0].className);
    expect(chunks1[0].css).toBe(chunks2[0].css);
  });

  it('should generate different className for different styles', () => {
    const styles1 = { display: 'block' };
    const styles2 = { display: 'flex' };

    const chunks1 = extractStylesWithChunks(styles1);
    const chunks2 = extractStylesWithChunks(styles2);

    expect(chunks1[0].className).not.toBe(chunks2[0].className);
  });
});

describe('extractKeyframesFromStyles', () => {
  it('should return empty result when no animations used', () => {
    const styles = { display: 'block' };
    const result = extractKeyframesFromStyles(styles);

    expect(result.keyframes).toEqual([]);
    expect(result.nameMap.size).toBe(0);
  });

  it('should extract and hash keyframes names', () => {
    const styles = {
      animation: 'fadeIn 1s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
      },
    };
    const result = extractKeyframesFromStyles(styles);

    expect(result.keyframes).toHaveLength(1);
    expect(result.keyframes[0].name).toMatch(/^kf[a-f0-9]{6}$/);
    expect(result.nameMap.get('fadeIn')).toBe(result.keyframes[0].name);
  });

  it('should deduplicate keyframes with same content but different names', () => {
    const styles = {
      animation: 'fadeIn 1s, appear 2s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
        appear: { from: 'opacity: 0', to: 'opacity: 1' }, // Same content
      },
    };
    const result = extractKeyframesFromStyles(styles);

    // Only one keyframe should be emitted
    expect(result.keyframes).toHaveLength(1);

    // Both names should map to the same hashed name
    expect(result.nameMap.get('fadeIn')).toBe(result.nameMap.get('appear'));
  });

  it('should generate same hash for same content across different calls', () => {
    const styles1 = {
      animation: 'fadeIn 1s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
      },
    };
    const styles2 = {
      animation: 'appear 1s',
      '@keyframes': {
        appear: { from: 'opacity: 0', to: 'opacity: 1' }, // Same content, different name
      },
    };

    const result1 = extractKeyframesFromStyles(styles1);
    const result2 = extractKeyframesFromStyles(styles2);

    // Same hash-based name since content is identical
    expect(result1.keyframes[0].name).toBe(result2.keyframes[0].name);
    expect(result1.keyframes[0].css).toBe(result2.keyframes[0].css);
  });

  it('should generate different hashes for different content', () => {
    const styles1 = {
      animation: 'fadeIn 1s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
      },
    };
    const styles2 = {
      animation: 'slideIn 1s',
      '@keyframes': {
        slideIn: {
          from: 'transform: translateX(-100%)',
          to: 'transform: translateX(0)',
        },
      },
    };

    const result1 = extractKeyframesFromStyles(styles1);
    const result2 = extractKeyframesFromStyles(styles2);

    expect(result1.keyframes[0].name).not.toBe(result2.keyframes[0].name);
  });

  it('should use global keyframes when local not defined', () => {
    const styles = { animation: 'fadeIn 1s' };
    const globalKeyframes = {
      fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
    };

    const result = extractKeyframesFromStyles(styles, globalKeyframes);

    expect(result.keyframes).toHaveLength(1);
    expect(result.nameMap.get('fadeIn')).toBe(result.keyframes[0].name);
  });

  it('should prefer local keyframes over global', () => {
    const styles = {
      animation: 'fadeIn 1s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 0.5' }, // Different from global
      },
    };
    const globalKeyframes = {
      fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
    };

    const result = extractKeyframesFromStyles(styles, globalKeyframes);

    // Should use local definition
    expect(result.keyframes[0].css).toContain('opacity: 0.5');
    expect(result.keyframes[0].css).not.toContain('opacity: 1');
  });
});

describe('CSSWriter deduplication', () => {
  it('should deduplicate identical styles from different elements', () => {
    // Simulate two elements with identical styles
    const styles1 = { display: 'block', color: 'red' };
    const styles2 = { display: 'block', color: 'red' };

    const chunks1 = extractStylesWithChunks(styles1);
    const chunks2 = extractStylesWithChunks(styles2);

    // Same className means CSSWriter will deduplicate
    expect(chunks1[0].className).toBe(chunks2[0].className);
    expect(chunks1[0].css).toBe(chunks2[0].css);
  });

  it('should deduplicate identical keyframes from different elements', () => {
    const styles1 = {
      animation: 'fadeIn 1s',
      '@keyframes': {
        fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
      },
    };
    const styles2 = {
      animation: 'appear 1s',
      '@keyframes': {
        appear: { from: 'opacity: 0', to: 'opacity: 1' }, // Same content
      },
    };

    const result1 = extractKeyframesFromStyles(styles1);
    const result2 = extractKeyframesFromStyles(styles2);

    // Same CSS content means CSSWriter will deduplicate
    expect(result1.keyframes[0].css).toBe(result2.keyframes[0].css);
  });
});
