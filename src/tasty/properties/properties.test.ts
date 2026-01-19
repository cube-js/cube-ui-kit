import { Styles } from '../styles/types';

import {
  extractLocalProperties,
  getEffectiveDefinition,
  hasLocalProperties,
  isValidPropertyName,
  normalizePropertyDefinition,
  normalizePropertyName,
  parsePropertyToken,
} from './index';

describe('properties', () => {
  describe('hasLocalProperties', () => {
    it('should return false when no @properties defined', () => {
      const styles: Styles = { fill: '#red' };
      expect(hasLocalProperties(styles)).toBe(false);
    });

    it('should return true when @properties is defined', () => {
      const styles: Styles = {
        fill: '#red',
        '@properties': {
          '$my-prop': { syntax: '<number>', initialValue: '0' },
        },
      };
      expect(hasLocalProperties(styles)).toBe(true);
    });

    it('should return true even when @properties is empty object', () => {
      const styles: Styles = {
        '@properties': {},
      };
      expect(hasLocalProperties(styles)).toBe(true);
    });
  });

  describe('extractLocalProperties', () => {
    it('should return null when no @properties defined', () => {
      const styles: Styles = { fill: '#red' };
      expect(extractLocalProperties(styles)).toBeNull();
    });

    it('should extract @properties from styles', () => {
      const properties = {
        $rotation: {
          syntax: '<angle>',
          inherits: false,
          initialValue: '0deg',
        },
        '#theme': { initialValue: 'purple' },
      };
      const styles: Styles = {
        fill: '#red',
        '@properties': properties,
      };

      expect(extractLocalProperties(styles)).toEqual(properties);
    });

    it('should return null for non-object @properties value', () => {
      const styles = {
        '@properties': 'invalid',
      } as unknown as Styles;

      expect(extractLocalProperties(styles)).toBeNull();
    });
  });

  describe('isValidPropertyName', () => {
    it('should return true for valid property names', () => {
      expect(isValidPropertyName('my-prop')).toBe(true);
      expect(isValidPropertyName('myProp')).toBe(true);
      expect(isValidPropertyName('my_prop')).toBe(true);
      expect(isValidPropertyName('_private')).toBe(true);
      expect(isValidPropertyName('a')).toBe(true);
      expect(isValidPropertyName('prop123')).toBe(true);
    });

    it('should return false for invalid property names', () => {
      expect(isValidPropertyName('')).toBe(false);
      expect(isValidPropertyName('123invalid')).toBe(false);
      expect(isValidPropertyName('-starts-with-dash')).toBe(false);
      expect(isValidPropertyName('has space')).toBe(false);
      expect(isValidPropertyName('has.dot')).toBe(false);
    });
  });

  describe('parsePropertyToken', () => {
    it('should parse $name token to --name', () => {
      const result = parsePropertyToken('$my-prop');
      expect(result.cssName).toBe('--my-prop');
      expect(result.isColor).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it('should parse #name token to --name-color', () => {
      const result = parsePropertyToken('#theme');
      expect(result.cssName).toBe('--theme-color');
      expect(result.isColor).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should parse --name legacy format', () => {
      const result = parsePropertyToken('--my-prop');
      expect(result.cssName).toBe('--my-prop');
      expect(result.isColor).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it('should detect color in --name-color legacy format', () => {
      const result = parsePropertyToken('--my-color');
      expect(result.cssName).toBe('--my-color');
      expect(result.isColor).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should parse name without prefix as legacy format', () => {
      const result = parsePropertyToken('my-prop');
      expect(result.cssName).toBe('--my-prop');
      expect(result.isColor).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for empty token', () => {
      const result = parsePropertyToken('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for $ with no name', () => {
      const result = parsePropertyToken('$');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return invalid for # with no name', () => {
      const result = parsePropertyToken('#');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return invalid for names starting with numbers', () => {
      const result = parsePropertyToken('$123invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid property name');
    });
  });

  describe('getEffectiveDefinition', () => {
    it('should return user definition for $name tokens', () => {
      const result = getEffectiveDefinition('$rotation', {
        syntax: '<angle>',
        inherits: false,
        initialValue: '45deg',
      });

      expect(result.isValid).toBe(true);
      expect(result.cssName).toBe('--rotation');
      expect(result.definition).toEqual({
        syntax: '<angle>',
        inherits: false,
        initialValue: '45deg',
      });
    });

    it('should auto-set syntax for #name color tokens', () => {
      const result = getEffectiveDefinition('#theme', {
        initialValue: 'purple',
      });

      expect(result.isValid).toBe(true);
      expect(result.cssName).toBe('--theme-color');
      expect(result.definition).toEqual({
        syntax: '<color>',
        inherits: undefined,
        initialValue: 'purple',
      });
    });

    it('should default initialValue to transparent for #name tokens', () => {
      const result = getEffectiveDefinition('#accent', {});

      expect(result.isValid).toBe(true);
      expect(result.cssName).toBe('--accent-color');
      expect(result.definition).toEqual({
        syntax: '<color>',
        inherits: undefined,
        initialValue: 'transparent',
      });
    });

    it('should allow inherits to be customized for color tokens', () => {
      const result = getEffectiveDefinition('#bg', {
        inherits: false,
        initialValue: 'white',
      });

      expect(result.isValid).toBe(true);
      expect(result.cssName).toBe('--bg-color');
      expect(result.definition).toEqual({
        syntax: '<color>',
        inherits: false,
        initialValue: 'white',
      });
    });

    it('should ignore user syntax for color tokens (always <color>)', () => {
      const result = getEffectiveDefinition('#custom', {
        syntax: '<number>', // Should be ignored
        initialValue: 'red',
      });

      expect(result.isValid).toBe(true);
      expect(result.definition.syntax).toBe('<color>');
    });

    it('should return invalid for invalid tokens', () => {
      const result = getEffectiveDefinition('$123invalid', {
        syntax: '<number>',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('normalizePropertyName (legacy)', () => {
    it('should handle $name token format', () => {
      expect(normalizePropertyName('$my-prop')).toBe('--my-prop');
    });

    it('should handle #name token format', () => {
      expect(normalizePropertyName('#theme')).toBe('--theme-color');
    });

    it('should keep -- prefix if already present', () => {
      expect(normalizePropertyName('--my-color')).toBe('--my-color');
    });

    it('should add -- prefix for plain names', () => {
      expect(normalizePropertyName('my-color')).toBe('--my-color');
    });
  });

  describe('normalizePropertyDefinition', () => {
    it('should create consistent JSON for same properties in different order', () => {
      const def1 = { syntax: '<color>', inherits: true, initialValue: 'red' };
      const def2 = { inherits: true, initialValue: 'red', syntax: '<color>' };
      const def3 = { initialValue: 'red', syntax: '<color>', inherits: true };

      const normalized1 = normalizePropertyDefinition(def1);
      const normalized2 = normalizePropertyDefinition(def2);
      const normalized3 = normalizePropertyDefinition(def3);

      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
    });

    it('should handle partial definitions', () => {
      const defSyntaxOnly = { syntax: '<color>' };
      const defInheritsOnly = { inherits: false };
      const defInitialOnly = { initialValue: '10px' };

      expect(normalizePropertyDefinition(defSyntaxOnly)).toBe(
        '{"syntax":"<color>"}',
      );
      expect(normalizePropertyDefinition(defInheritsOnly)).toBe(
        '{"inherits":false}',
      );
      expect(normalizePropertyDefinition(defInitialOnly)).toBe(
        '{"initialValue":"10px"}',
      );
    });

    it('should convert numeric initialValue to string', () => {
      const def = { initialValue: 42 };
      expect(normalizePropertyDefinition(def)).toBe('{"initialValue":"42"}');
    });

    it('should handle empty definition', () => {
      const def = {};
      expect(normalizePropertyDefinition(def)).toBe('{}');
    });

    it('should produce different results for different values', () => {
      const def1 = { syntax: '<color>', initialValue: 'red' };
      const def2 = { syntax: '<color>', initialValue: 'blue' };

      expect(normalizePropertyDefinition(def1)).not.toBe(
        normalizePropertyDefinition(def2),
      );
    });

    it('should produce different results for different inherits values', () => {
      const def1 = { inherits: true };
      const def2 = { inherits: false };

      expect(normalizePropertyDefinition(def1)).not.toBe(
        normalizePropertyDefinition(def2),
      );
    });
  });
});
