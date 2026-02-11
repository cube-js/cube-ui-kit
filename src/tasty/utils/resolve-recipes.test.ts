/**
 * Tests for recipe resolution utility.
 */
import {
  configure,
  getGlobalRecipes,
  hasGlobalRecipes,
  resetConfig,
} from '../config';
import { Styles } from '../styles/types';

import { resolveRecipes } from './resolve-recipes';

describe('resolveRecipes', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  // ============================================================================
  // No recipes configured
  // ============================================================================

  describe('when no recipes are configured', () => {
    it('returns the same object reference', () => {
      const styles: Styles = { padding: '2x', fill: '#purple' };
      const result = resolveRecipes(styles);
      expect(result).toBe(styles);
    });

    it('returns styles with recipe key unchanged (no global recipes)', () => {
      const styles: Styles = { recipe: 'card', padding: '2x' };
      const result = resolveRecipes(styles);
      expect(result).toBe(styles);
    });
  });

  // ============================================================================
  // Basic recipe resolution
  // ============================================================================

  describe('basic resolution', () => {
    beforeEach(() => {
      configure({
        recipes: {
          card: { padding: '4x', fill: '#surface', radius: '1r', border: true },
          elevated: { shadow: '2x 2x 4x #shadow' },
          rounded: { radius: '2r' },
        },
      });
    });

    it('returns same reference when no recipe key present', () => {
      const styles: Styles = { padding: '2x', fill: '#purple' };
      const result = resolveRecipes(styles);
      expect(result).toBe(styles);
    });

    it('resolves a single recipe', () => {
      const styles: Styles = { recipe: 'card', color: '#text' };
      const result = resolveRecipes(styles);

      expect(result).not.toBe(styles);
      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        radius: '1r',
        border: true,
        color: '#text',
      });
      expect(result.recipe).toBeUndefined();
    });

    it('resolves multiple recipes in order', () => {
      const styles: Styles = { recipe: 'card, elevated', color: '#text' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        radius: '1r',
        border: true,
        shadow: '2x 2x 4x #shadow',
        color: '#text',
      });
    });

    it('later recipes override earlier ones', () => {
      const styles: Styles = { recipe: 'card, rounded' };
      const result = resolveRecipes(styles);

      // 'rounded' overrides 'card' radius
      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        radius: '2r',
        border: true,
      });
    });

    it('component styles override recipe values', () => {
      const styles: Styles = { recipe: 'card', padding: '8x', fill: '#white' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '8x',
        fill: '#white',
        radius: '1r',
        border: true,
      });
    });

    it('handles empty recipe string (clears recipes)', () => {
      const styles: Styles = { recipe: '', padding: '2x' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({ padding: '2x' });
      expect(result.recipe).toBeUndefined();
    });

    it('handles whitespace-only recipe string', () => {
      const styles: Styles = { recipe: '   ', padding: '2x' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({ padding: '2x' });
      expect(result.recipe).toBeUndefined();
    });

    it('handles recipe with extra whitespace', () => {
      const styles: Styles = { recipe: '  card , elevated  ', color: '#text' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        radius: '1r',
        border: true,
        shadow: '2x 2x 4x #shadow',
        color: '#text',
      });
    });

    it('skips unknown recipe names gracefully', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const styles: Styles = { recipe: 'unknown, card' };
      const result = resolveRecipes(styles);

      // Should still resolve the known recipe
      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        radius: '1r',
        border: true,
      });

      warnSpy.mockRestore();
    });
  });

  // ============================================================================
  // Sub-element recipe resolution
  // ============================================================================

  describe('sub-element recipes', () => {
    beforeEach(() => {
      configure({
        recipes: {
          card: { padding: '4x', fill: '#surface' },
          header: { preset: 'h3', color: '#primary' },
        },
      });
    });

    it('resolves recipes in sub-elements', () => {
      const styles: Styles = {
        padding: '2x',
        Title: {
          recipe: 'header',
          fontWeight: 'bold',
        },
      };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '2x',
        Title: {
          preset: 'h3',
          color: '#primary',
          fontWeight: 'bold',
        },
      });
    });

    it('resolves recipes at both top-level and sub-element', () => {
      const styles: Styles = {
        recipe: 'card',
        color: '#text',
        Title: {
          recipe: 'header',
        },
      };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '4x',
        fill: '#surface',
        color: '#text',
        Title: {
          preset: 'h3',
          color: '#primary',
        },
      });
    });

    it('returns same reference when sub-elements have no recipe', () => {
      const styles: Styles = {
        padding: '2x',
        Title: { preset: 'h3' },
      };
      const result = resolveRecipes(styles);
      expect(result).toBe(styles);
    });

    it('handles sub-element with empty recipe string', () => {
      const styles: Styles = {
        Title: {
          recipe: '',
          preset: 'h3',
        },
      };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        Title: {
          preset: 'h3',
        },
      });
    });
  });

  // ============================================================================
  // Recipe with special keys
  // ============================================================================

  describe('recipes with special keys', () => {
    it('merges recipe with @keyframes', () => {
      configure({
        recipes: {
          animated: {
            animation: 'fadeIn 0.3s',
            '@keyframes': {
              fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
            },
          },
        },
      });

      const styles: Styles = { recipe: 'animated', padding: '2x' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        animation: 'fadeIn 0.3s',
        '@keyframes': {
          fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        },
        padding: '2x',
      });
    });

    it('merges recipe with token definitions', () => {
      configure({
        recipes: {
          themed: {
            '#primary': 'rgb(100 50 200)',
            fill: '#primary',
          } as any,
        },
      });

      const styles: Styles = { recipe: 'themed', padding: '2x' };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        '#primary': 'rgb(100 50 200)',
        fill: '#primary',
        padding: '2x',
      });
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================

  describe('edge cases', () => {
    beforeEach(() => {
      configure({
        recipes: {
          card: { padding: '4x' },
        },
      });
    });

    it('handles non-string recipe value gracefully', () => {
      const styles = { recipe: 123, padding: '2x' } as unknown as Styles;
      const result = resolveRecipes(styles);

      // Non-string recipe is removed but no crash
      expect(result).toEqual({ padding: '2x' });
    });

    it('handles sub-element that is false (removal marker)', () => {
      const styles: Styles = {
        recipe: 'card',
        Title: false as any,
      };
      const result = resolveRecipes(styles);

      expect(result).toEqual({
        padding: '4x',
        Title: false,
      });
    });

    it('handles sub-element that is a primitive value', () => {
      const styles: Styles = {
        recipe: 'card',
        Title: 'some-value' as any,
      };
      const result = resolveRecipes(styles);

      // Primitive sub-element values are left as-is
      expect(result).toEqual({
        padding: '4x',
        Title: 'some-value',
      });
    });
  });
});

// ============================================================================
// Config integration tests
// ============================================================================

describe('recipes config', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  it('stores and retrieves recipes', () => {
    expect(hasGlobalRecipes()).toBe(false);
    expect(getGlobalRecipes()).toBeNull();

    configure({
      recipes: {
        card: { padding: '4x' },
      },
    });

    expect(hasGlobalRecipes()).toBe(true);
    expect(getGlobalRecipes()).toEqual({
      card: { padding: '4x' },
    });
  });

  it('merges plugin recipes with config recipes (config wins)', () => {
    configure({
      plugins: [
        {
          name: 'test-plugin',
          recipes: {
            card: { padding: '2x' },
            elevated: { shadow: '1x 1x 2x #shadow' },
          },
        },
      ],
      recipes: {
        card: { padding: '4x' }, // Override plugin
      },
    });

    const recipes = getGlobalRecipes();
    expect(recipes).toEqual({
      card: { padding: '4x' },
      elevated: { shadow: '1x 1x 2x #shadow' },
    });
  });

  it('resets recipes on resetConfig()', () => {
    configure({
      recipes: { card: { padding: '4x' } },
    });

    expect(hasGlobalRecipes()).toBe(true);

    resetConfig();

    expect(hasGlobalRecipes()).toBe(false);
    expect(getGlobalRecipes()).toBeNull();
  });

  it('stores recipes even with sub-element keys (validation is dev-mode only)', () => {
    // Dev-mode validation warnings are only emitted when isDevEnv() returns true.
    // In test environment (NODE_ENV=test), isDevEnv() returns false.
    // Here we verify the recipes are still stored correctly.
    configure({
      recipes: {
        bad: {
          padding: '2x',
          Title: { preset: 'h3' },
        } as any,
      },
    });

    const recipes = getGlobalRecipes();
    expect(recipes).toBeDefined();
    expect(recipes!.bad).toBeDefined();
  });

  it('stores recipes even with recursive recipe key (validation is dev-mode only)', () => {
    // Dev-mode validation warnings are only emitted when isDevEnv() returns true.
    // In test environment (NODE_ENV=test), isDevEnv() returns false.
    configure({
      recipes: {
        bad: {
          recipe: 'other',
          padding: '2x',
        } as any,
      },
    });

    const recipes = getGlobalRecipes();
    expect(recipes).toBeDefined();
    expect(recipes!.bad).toBeDefined();
  });
});
