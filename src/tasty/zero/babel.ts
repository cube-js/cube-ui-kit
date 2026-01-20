/**
 * Babel plugin for zero-runtime tasty static site generation.
 *
 * Transforms:
 * - `tastyStatic(styles)` → StaticStyle object { className, styles, toString() }
 * - `tastyStatic(base, styles)` → StaticStyle object with merged styles
 * - `tastyStatic(selector, styles)` → removed entirely
 *
 * Usage:
 * ```javascript
 * // babel.config.js
 * module.exports = {
 *   plugins: [
 *     ['@cube-dev/ui-kit/tasty/zero/babel', { output: 'public/tasty.css' }]
 *   ]
 * };
 * ```
 */

import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';

import { configure } from '../config';
import { Styles } from '../styles/types';
import { mergeStyles } from '../utils/mergeStyles';
import { StyleHandlerDefinition } from '../utils/styles';

import { CSSWriter } from './css-writer';
import {
  extractKeyframesFromStyles,
  extractStylesForSelector,
  extractStylesWithChunks,
  KeyframesExtractionResult,
} from './extractor';

import type { NodePath, PluginPass } from '@babel/core';
import type { KeyframesSteps } from '../injector/types';
import type { StyleDetails, UnitHandler } from '../parser/types';
import type { TastyPlugin } from '../plugins/types';

/**
 * Build-time configuration for zero-runtime mode.
 * Subset of TastyConfig that applies at build time.
 */
export interface TastyZeroConfig {
  /**
   * Global predefined states for advanced state mapping.
   * Example: { '@mobile': '@media(w < 768px)', '@dark': '@root(theme=dark)' }
   */
  states?: Record<string, string>;
  /**
   * Enable development mode features: source comments in generated CSS.
   * Default: false
   */
  devMode?: boolean;
  /**
   * Parser LRU cache size (default: 1000).
   * Larger values improve performance for builds with many unique style values.
   */
  parserCacheSize?: number;
  /**
   * Custom units for the style parser (merged with built-in units).
   * Units transform numeric values like `2x` → `calc(2 * var(--gap))`.
   * @example { em: 'em', vw: 'vw', custom: (n) => `${n * 10}px` }
   */
  units?: Record<string, string | UnitHandler>;
  /**
   * Custom functions for the style parser (merged with existing).
   * Functions process parsed style groups and return CSS values.
   * @example { myFunc: (groups) => groups.map(g => g.output).join(' ') }
   */
  funcs?: Record<string, (groups: StyleDetails[]) => string>;
  /**
   * Plugins that extend tasty with custom functions, units, states, handlers, or tokens.
   * Plugins are processed in order, with later plugins overriding earlier ones.
   * @example
   * ```ts
   * import { okhslPlugin } from '@cube-dev/ui-kit/tasty/plugins';
   *
   * // babel.config.js
   * module.exports = {
   *   plugins: [
   *     ['@cube-dev/ui-kit/tasty/zero/babel', {
   *       config: { plugins: [okhslPlugin()] }
   *     }]
   *   ]
   * };
   * ```
   */
  plugins?: TastyPlugin[];
  /**
   * Global keyframes definitions for static extraction.
   * Keys are animation names, values are keyframes step definitions.
   * @example { fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } }
   */
  keyframes?: Record<string, KeyframesSteps>;
  /**
   * Custom style handlers that transform style properties into CSS declarations.
   * Handlers replace built-in handlers for the same style name.
   * @example
   * ```ts
   * handlers: {
   *   fill: ({ fill }) => fill ? { 'background-color': fill } : undefined,
   *   elevation: ({ elevation }) => ({
   *     'box-shadow': `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)`,
   *   }),
   * }
   * ```
   */
  handlers?: Record<string, StyleHandlerDefinition>;
  /**
   * Predefined tokens that are replaced during style parsing.
   * Use `$name` for custom properties and `#name` for color tokens.
   * @example { $spacing: '2x', '#accent': '#purple' }
   */
  tokens?: {
    [key: `$${string}` | `#${string}`]: string | number;
  };
}

export interface TastyZeroBabelOptions {
  /** Output path for generated CSS (default: 'tasty.css') */
  output?: string;
  /** Tasty configuration for build-time processing */
  config?: TastyZeroConfig;
}

/**
 * Registry to track StaticStyle objects by their variable names.
 * Used to resolve base styles when extending.
 */
interface StaticStyleRegistry {
  [variableName: string]: {
    styles: Styles;
    className: string;
  };
}

interface PluginState extends PluginPass {
  staticStyleRegistry: StaticStyleRegistry;
  /** Current source file path (for devMode source comments) */
  sourceFile?: string;
}

export default declare<TastyZeroBabelOptions>((api, options) => {
  api.assertVersion(7);

  const outputPath = options.output || 'tasty.css';
  const config = options.config || {};
  const devMode = config.devMode ?? false;

  // Apply configuration using the shared configure() function
  // This handles plugin merging, states, units, funcs, handlers, tokens, etc.
  configure(config);

  const cssWriter = new CSSWriter(outputPath, { devMode });

  // Global registry for cross-file references (same build)
  const globalRegistry: StaticStyleRegistry = {};

  return {
    name: 'tasty-zero',

    pre(this: PluginState) {
      // Initialize per-file registry
      this.staticStyleRegistry = {};
      // Extract source filename for devMode comments
      if (devMode && this.filename) {
        // Get relative path or just filename
        this.sourceFile = this.filename.split('/').pop() || this.filename;
      }
    },

    visitor: {
      // Remove import statements for tasty/static
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const source = path.node.source.value;

        if (
          source === '@cube-dev/ui-kit/tasty/static' ||
          source.endsWith('/tasty/static')
        ) {
          path.remove();
        }
      },

      // Transform tastyStatic() calls
      CallExpression(path: NodePath<t.CallExpression>, state: PluginState) {
        const callee = path.node.callee;

        // Match tastyStatic(...) calls
        if (!t.isIdentifier(callee, { name: 'tastyStatic' })) {
          return;
        }

        const args = path.node.arguments;

        if (args.length === 0) {
          throw path.buildCodeFrameError(
            'tastyStatic() requires at least one argument',
          );
        }

        const firstArg = args[0];

        if (t.isStringLiteral(firstArg)) {
          // Selector mode: tastyStatic(selector, styles)
          handleSelectorMode(
            path,
            args,
            cssWriter,
            state.sourceFile,
            config.keyframes,
          );
        } else if (t.isObjectExpression(firstArg)) {
          // Styles mode: tastyStatic(styles)
          handleStylesMode(
            path,
            args,
            cssWriter,
            state,
            globalRegistry,
            config.keyframes,
          );
        } else if (t.isIdentifier(firstArg)) {
          // Extension mode: tastyStatic(base, styles)
          handleExtensionMode(
            path,
            args,
            cssWriter,
            state,
            globalRegistry,
            config.keyframes,
          );
        } else {
          throw path.buildCodeFrameError(
            'tastyStatic() first argument must be an object (styles), ' +
              'identifier (base StaticStyle), or string (selector)',
          );
        }
      },

      // Track variable declarations to register StaticStyle objects
      VariableDeclarator(
        path: NodePath<t.VariableDeclarator>,
        state: PluginState,
      ) {
        const init = path.node.init;
        const id = path.node.id;

        // Check if this is a StaticStyle object (has className and styles properties)
        if (
          t.isIdentifier(id) &&
          t.isObjectExpression(init) &&
          isStaticStyleObject(init)
        ) {
          const variableName = id.name;
          const styles = extractStylesFromStaticStyleObject(init, path);
          const className = extractClassNameFromStaticStyleObject(init);

          if (styles && className) {
            state.staticStyleRegistry[variableName] = { styles, className };
            globalRegistry[variableName] = { styles, className };
          }
        }
      },
    },

    post() {
      // Write all collected CSS at the end of the build
      if (cssWriter.size > 0) {
        cssWriter.write();
      }
    },
  };
});

/**
 * Check if an object expression looks like a StaticStyle object
 */
function isStaticStyleObject(node: t.ObjectExpression): boolean {
  const hasClassName = node.properties.some(
    (p) =>
      t.isObjectProperty(p) && t.isIdentifier(p.key, { name: 'className' }),
  );
  const hasStyles = node.properties.some(
    (p) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name: 'styles' }),
  );
  return hasClassName && hasStyles;
}

/**
 * Extract styles object from a StaticStyle object expression
 */
function extractStylesFromStaticStyleObject(
  node: t.ObjectExpression,
  path: NodePath,
): Styles | null {
  for (const prop of node.properties) {
    if (
      t.isObjectProperty(prop) &&
      t.isIdentifier(prop.key, { name: 'styles' }) &&
      t.isObjectExpression(prop.value)
    ) {
      return evaluateObjectExpression(prop.value, path) as Styles;
    }
  }
  return null;
}

/**
 * Extract className from a StaticStyle object expression
 */
function extractClassNameFromStaticStyleObject(
  node: t.ObjectExpression,
): string | null {
  for (const prop of node.properties) {
    if (
      t.isObjectProperty(prop) &&
      t.isIdentifier(prop.key, { name: 'className' }) &&
      t.isStringLiteral(prop.value)
    ) {
      return prop.value.value;
    }
  }
  return null;
}

/**
 * Handle tastyStatic(styles) - returns StaticStyle object
 */
function handleStylesMode(
  path: NodePath<t.CallExpression>,
  args: t.CallExpression['arguments'],
  cssWriter: CSSWriter,
  state: PluginState,
  globalRegistry: StaticStyleRegistry,
  globalKeyframes?: Record<string, KeyframesSteps>,
): void {
  const stylesArg = args[0];

  if (!t.isObjectExpression(stylesArg)) {
    throw path.buildCodeFrameError(
      'tastyStatic(styles) argument must be a static object literal',
    );
  }

  // Evaluate styles object at build time
  const styles = evaluateObjectExpression(stylesArg, path) as Styles;

  // Extract keyframes (deduplicated by content)
  const { keyframes, nameMap } = extractKeyframesFromStyles(
    styles,
    globalKeyframes,
  );

  // Add keyframes CSS
  for (const kf of keyframes) {
    cssWriter.add(kf.css, kf.css, state.sourceFile);
  }

  // Extract styles with chunking
  const chunks = extractStylesWithChunks(styles);

  // Add CSS to writer, replacing animation names if needed
  for (const chunk of chunks) {
    const css =
      nameMap.size > 0
        ? replaceAnimationNamesInCSS(chunk.css, nameMap)
        : chunk.css;
    cssWriter.add(chunk.className, css, state.sourceFile);
  }

  // Generate className
  const className =
    chunks.length > 0 ? chunks.map((c) => c.className).join(' ') : '';

  // Replace call with StaticStyle object
  const staticStyleObject = createStaticStyleAST(className, styles);
  path.replaceWith(staticStyleObject);

  // Register if this is being assigned to a variable
  registerIfVariableDeclaration(path, className, styles, state, globalRegistry);
}

/**
 * Handle tastyStatic(base, styles) - extends base with additional styles
 */
function handleExtensionMode(
  path: NodePath<t.CallExpression>,
  args: t.CallExpression['arguments'],
  cssWriter: CSSWriter,
  state: PluginState,
  globalRegistry: StaticStyleRegistry,
  globalKeyframes?: Record<string, KeyframesSteps>,
): void {
  if (args.length < 2) {
    throw path.buildCodeFrameError(
      'tastyStatic(base, styles) requires two arguments',
    );
  }

  const baseArg = args[0];
  const stylesArg = args[1];

  if (!t.isIdentifier(baseArg)) {
    throw path.buildCodeFrameError(
      'tastyStatic(base, styles) first argument must be an identifier',
    );
  }

  if (!t.isObjectExpression(stylesArg)) {
    throw path.buildCodeFrameError(
      'tastyStatic(base, styles) second argument must be a static object literal',
    );
  }

  const baseName = baseArg.name;

  // Look up base styles in registry
  const baseEntry =
    state.staticStyleRegistry[baseName] || globalRegistry[baseName];

  if (!baseEntry) {
    throw path.buildCodeFrameError(
      `Cannot find base StaticStyle '${baseName}'. ` +
        'Make sure it is defined before being extended.',
    );
  }

  // Evaluate override styles
  const overrideStyles = evaluateObjectExpression(stylesArg, path) as Styles;

  // Merge styles using mergeStyles
  const mergedStyles = mergeStyles(baseEntry.styles, overrideStyles);

  // Extract keyframes (deduplicated by content)
  const { keyframes, nameMap } = extractKeyframesFromStyles(
    mergedStyles,
    globalKeyframes,
  );

  // Add keyframes CSS
  for (const kf of keyframes) {
    cssWriter.add(kf.css, kf.css, state.sourceFile);
  }

  // Extract styles with chunking
  const chunks = extractStylesWithChunks(mergedStyles);

  // Add CSS to writer, replacing animation names if needed
  for (const chunk of chunks) {
    const css =
      nameMap.size > 0
        ? replaceAnimationNamesInCSS(chunk.css, nameMap)
        : chunk.css;
    cssWriter.add(chunk.className, css, state.sourceFile);
  }

  // Generate className
  const className =
    chunks.length > 0 ? chunks.map((c) => c.className).join(' ') : '';

  // Replace call with StaticStyle object
  const staticStyleObject = createStaticStyleAST(className, mergedStyles);
  path.replaceWith(staticStyleObject);

  // Register if this is being assigned to a variable
  registerIfVariableDeclaration(
    path,
    className,
    mergedStyles,
    state,
    globalRegistry,
  );
}

/**
 * Handle tastyStatic(selector, styles) - removes the call entirely
 */
function handleSelectorMode(
  path: NodePath<t.CallExpression>,
  args: t.CallExpression['arguments'],
  cssWriter: CSSWriter,
  sourceFile?: string,
  globalKeyframes?: Record<string, KeyframesSteps>,
): void {
  if (args.length < 2) {
    throw path.buildCodeFrameError(
      'tastyStatic(selector, styles) requires two arguments',
    );
  }

  const selectorArg = args[0];
  const stylesArg = args[1];

  if (!t.isStringLiteral(selectorArg)) {
    throw path.buildCodeFrameError(
      'tastyStatic(selector, styles) first argument must be a string literal',
    );
  }

  if (!t.isObjectExpression(stylesArg)) {
    throw path.buildCodeFrameError(
      'tastyStatic(selector, styles) second argument must be a static object literal',
    );
  }

  const selector = selectorArg.value;
  const styles = evaluateObjectExpression(stylesArg, path) as Styles;

  // Extract keyframes (deduplicated by content)
  const { keyframes, nameMap } = extractKeyframesFromStyles(
    styles,
    globalKeyframes,
  );

  // Add keyframes CSS
  for (const kf of keyframes) {
    cssWriter.add(kf.css, kf.css, sourceFile);
  }

  // Extract styles for selector
  const result = extractStylesForSelector(selector, styles);

  // Replace animation names if needed and add CSS
  const css =
    nameMap.size > 0
      ? replaceAnimationNamesInCSS(result.css, nameMap)
      : result.css;
  cssWriter.add(selector, css, sourceFile);

  // Remove the entire statement
  const parent = path.parentPath;
  if (parent && t.isExpressionStatement(parent.node)) {
    parent.remove();
  } else {
    // If used in an expression context (which would be incorrect usage),
    // replace with undefined
    path.replaceWith(t.identifier('undefined'));
  }
}

/**
 * Create a StaticStyle object AST node
 */
function createStaticStyleAST(
  className: string,
  styles: Styles,
): t.ObjectExpression {
  return t.objectExpression([
    t.objectProperty(t.identifier('className'), t.stringLiteral(className)),
    t.objectProperty(t.identifier('styles'), valueToAST(styles)),
    t.objectMethod(
      'method',
      t.identifier('toString'),
      [],
      t.blockStatement([
        t.returnStatement(
          t.memberExpression(t.thisExpression(), t.identifier('className')),
        ),
      ]),
    ),
  ]);
}

/**
 * Register a StaticStyle in the registry if it's being assigned to a variable
 */
function registerIfVariableDeclaration(
  path: NodePath,
  className: string,
  styles: Styles,
  state: PluginState,
  globalRegistry: StaticStyleRegistry,
): void {
  const parent = path.parentPath;
  if (parent && t.isVariableDeclarator(parent.node)) {
    const id = parent.node.id;
    if (t.isIdentifier(id)) {
      const variableName = id.name;
      state.staticStyleRegistry[variableName] = { styles, className };
      globalRegistry[variableName] = { styles, className };
    }
  }
}

/**
 * Convert a JavaScript value to an AST node
 */
function valueToAST(value: unknown): t.Expression {
  if (value === null) {
    return t.nullLiteral();
  }
  if (value === undefined) {
    return t.identifier('undefined');
  }
  if (typeof value === 'string') {
    return t.stringLiteral(value);
  }
  if (typeof value === 'number') {
    return t.numericLiteral(value);
  }
  if (typeof value === 'boolean') {
    return t.booleanLiteral(value);
  }
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(valueToAST));
  }
  if (typeof value === 'object') {
    const properties = Object.entries(value).map(([key, val]) =>
      t.objectProperty(
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? t.identifier(key)
          : t.stringLiteral(key),
        valueToAST(val),
      ),
    );
    return t.objectExpression(properties);
  }
  // Fallback for unsupported types
  return t.identifier('undefined');
}

/**
 * Evaluate an ObjectExpression to a plain JavaScript object.
 * Only supports static values that can be determined at build time.
 */
function evaluateObjectExpression(
  node: t.ObjectExpression,
  path: NodePath,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const prop of node.properties) {
    if (t.isSpreadElement(prop)) {
      throw path.buildCodeFrameError(
        'Spread elements are not supported in tastyStatic() - styles must be fully static',
      );
    }

    if (!t.isObjectProperty(prop)) {
      throw path.buildCodeFrameError(
        'Only object properties are supported in tastyStatic()',
      );
    }

    // Get key
    let key: string;
    if (t.isIdentifier(prop.key)) {
      key = prop.key.name;
    } else if (t.isStringLiteral(prop.key)) {
      key = prop.key.value;
    } else {
      throw path.buildCodeFrameError(
        'Dynamic property keys are not supported in tastyStatic()',
      );
    }

    // Get value
    const value = evaluateExpression(prop.value, path);
    result[key] = value;
  }

  return result;
}

/**
 * Evaluate an expression to a JavaScript value.
 */
function evaluateExpression(node: t.Node, path: NodePath): unknown {
  if (t.isStringLiteral(node)) {
    return node.value;
  }

  if (t.isNumericLiteral(node)) {
    return node.value;
  }

  if (t.isBooleanLiteral(node)) {
    return node.value;
  }

  if (t.isNullLiteral(node)) {
    return null;
  }

  if (t.isIdentifier(node, { name: 'undefined' })) {
    return undefined;
  }

  if (t.isArrayExpression(node)) {
    return node.elements.map((el) => {
      if (el === null) return null;
      if (t.isSpreadElement(el)) {
        throw path.buildCodeFrameError(
          'Spread elements are not supported in tastyStatic()',
        );
      }
      return evaluateExpression(el, path);
    });
  }

  if (t.isObjectExpression(node)) {
    return evaluateObjectExpression(node, path);
  }

  if (t.isTemplateLiteral(node)) {
    // Only support template literals without expressions
    if (node.expressions.length > 0) {
      throw path.buildCodeFrameError(
        'Template literals with expressions are not supported in tastyStatic()',
      );
    }
    return node.quasis.map((q) => q.value.cooked).join('');
  }

  if (t.isUnaryExpression(node, { operator: '-' })) {
    const arg = evaluateExpression(node.argument, path);
    if (typeof arg === 'number') {
      return -arg;
    }
  }

  throw path.buildCodeFrameError(
    `Dynamic expressions are not supported in tastyStatic() - got ${node.type}. ` +
      'All values must be static literals.',
  );
}

/**
 * Replace animation names in CSS string.
 * Wraps the keyframes replaceAnimationNames to work on full CSS blocks.
 */
function replaceAnimationNamesInCSS(
  css: string,
  nameMap: Map<string, string>,
): string {
  if (nameMap.size === 0) return css;

  // The CSS contains full rules like ".class { animation: name 1s; }"
  // We need to replace animation names within declaration blocks
  return css.replace(
    /(animation(?:-name)?)\s*:\s*([^;}]+)/gi,
    (match, prop, value) => {
      let newValue = value;
      for (const [original, replacement] of nameMap) {
        // Word boundary replacement
        const pattern = new RegExp(`\\b${escapeRegex(original)}\\b`, 'g');
        newValue = newValue.replace(pattern, replacement);
      }
      return `${prop}: ${newValue}`;
    },
  );
}

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
