/**
 * Tests for custom style handler registration via configure() and plugins.
 */
import { renderStyles } from './pipeline';
import {
  normalizeHandlerDefinition,
  registerHandler,
  STYLE_HANDLER_MAP,
  styleHandlers,
} from './styles';

describe('Style Handlers Configuration', () => {
  describe('normalizeHandlerDefinition', () => {
    it('should normalize function-only definition', () => {
      const handler = ({ fill }) =>
        fill ? { 'background-color': fill } : undefined;
      const normalized = normalizeHandlerDefinition('fill', handler);

      expect(normalized.__lookupStyles).toEqual(['fill']);
      expect(typeof normalized).toBe('function');
    });

    it('should normalize single lookup style tuple', () => {
      const handler = ({ myProp }) =>
        myProp ? { 'custom-prop': myProp } : undefined;
      const normalized = normalizeHandlerDefinition('customName', [
        'myProp',
        handler,
      ]);

      expect(normalized.__lookupStyles).toEqual(['myProp']);
    });

    it('should normalize multi lookup style tuple', () => {
      const handler = ({ display, flow, gap }) =>
        gap ? { gap: gap } : undefined;
      const normalized = normalizeHandlerDefinition('customGap', [
        ['display', 'flow', 'gap'],
        handler,
      ]);

      expect(normalized.__lookupStyles).toEqual(['display', 'flow', 'gap']);
    });
  });

  describe('registerHandler', () => {
    it('should replace existing handlers for lookup styles', () => {
      // Get the original handler count
      const originalHandlers = STYLE_HANDLER_MAP['fill']?.length || 0;

      // Create a custom handler
      const customFill = ({ fill }) =>
        fill ? { 'background-color': `custom-${fill}` } : undefined;
      customFill.__lookupStyles = ['fill'];

      // Register it
      registerHandler(customFill);

      // Should have replaced (not appended)
      expect(STYLE_HANDLER_MAP['fill']).toHaveLength(1);
      expect(STYLE_HANDLER_MAP['fill'][0]).toBe(customFill);

      // Restore original by re-registering built-in handler
      registerHandler(styleHandlers.fill);
    });

    it('should register handler under multiple lookup styles', () => {
      const multiHandler = ({ propA, propB }) => ({
        'prop-a': propA || 'default',
        'prop-b': propB || 'default',
      });
      multiHandler.__lookupStyles = ['propA', 'propB'];

      registerHandler(multiHandler);

      expect(STYLE_HANDLER_MAP['propA']).toEqual([multiHandler]);
      expect(STYLE_HANDLER_MAP['propB']).toEqual([multiHandler]);

      // Cleanup
      delete STYLE_HANDLER_MAP['propA'];
      delete STYLE_HANDLER_MAP['propB'];
    });
  });

  describe('styleHandlers export', () => {
    it('should export wrapped handlers with __lookupStyles', () => {
      expect(styleHandlers.fill.__lookupStyles).toEqual(['fill']);
      expect(styleHandlers.gap.__lookupStyles).toEqual([
        'display',
        'flow',
        'gap',
      ]);
      expect(styleHandlers.border.__lookupStyles).toBeDefined();
      expect(styleHandlers.padding.__lookupStyles).toBeDefined();
    });

    it('should allow calling wrapped handlers directly', () => {
      const result = styleHandlers.fill({ fill: '#red' });
      expect(result).toEqual({ 'background-color': 'var(--red-color)' });
    });

    it('should return void for falsy values', () => {
      const result = styleHandlers.fill({ fill: '' });
      expect(result).toBeUndefined();
    });
  });

  describe('custom handler integration', () => {
    it('should use custom handler in renderStyles', () => {
      // Register a custom handler that adds a prefix
      const customFill = ({ fill }) => {
        if (!fill) return;
        return { 'background-color': `custom-${fill}` };
      };
      customFill.__lookupStyles = ['fill'];

      // Save original
      const originalHandler = STYLE_HANDLER_MAP['fill']?.[0];

      // Register custom
      registerHandler(customFill);

      // Render styles
      const result = renderStyles({ fill: 'blue' }, '.test');

      // Should use custom handler
      expect(result[0].declarations).toContain('custom-blue');

      // Restore original
      if (originalHandler) {
        registerHandler(originalHandler);
      }
    });

    it('should support delegating to built-in handler', () => {
      const customFill = ({ fill }) => {
        if (fill?.startsWith('gradient:')) {
          return { background: fill.slice(9) };
        }
        // Delegate to built-in
        return styleHandlers.fill({ fill });
      };
      customFill.__lookupStyles = ['fill'];

      // Save original
      const originalHandler = STYLE_HANDLER_MAP['fill']?.[0];

      // Register custom
      registerHandler(customFill);

      // Test gradient path
      const gradientResult = renderStyles(
        { fill: 'gradient:linear-gradient(red, blue)' },
        '.test',
      );
      expect(gradientResult[0].declarations).toContain(
        'linear-gradient(red, blue)',
      );

      // Test delegation path
      const normalResult = renderStyles({ fill: '#purple' }, '.test');
      expect(normalResult[0].declarations).toContain('var(--purple-color)');

      // Restore original
      if (originalHandler) {
        registerHandler(originalHandler);
      }
    });
  });
});
