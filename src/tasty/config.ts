/**
 * Tasty Configuration Module
 *
 * Centralizes all tasty configuration, including:
 * - Style injector settings (nonce, cleanup thresholds, etc.)
 * - Global predefined states for advanced state mapping
 * - stylesGenerated flag that locks configuration after first style generation
 *
 * Configuration must be done BEFORE any styles are generated.
 * After the first `inject()` call, configuration is locked and attempts to
 * reconfigure will emit a warning and be ignored.
 */

import { StyleInjector } from './injector/injector';
import { clearPipelineCache, isSelector } from './pipeline';
import { setGlobalPredefinedStates } from './states';
import {
  normalizeHandlerDefinition,
  registerHandler,
  resetHandlers,
} from './styles/predefined';
import { isDevEnv } from './utils/is-dev-env';
import {
  CUSTOM_UNITS,
  getGlobalFuncs,
  getGlobalParser,
  normalizeColorTokenValue,
  resetGlobalPredefinedTokens,
  setGlobalPredefinedTokens,
} from './utils/styles';

import type { KeyframesSteps, PropertyDefinition } from './injector/types';
import type { StyleDetails, UnitHandler } from './parser/types';
import type { TastyPlugin } from './plugins/types';
import type { RecipeStyles } from './styles/types';
import type { StyleHandlerDefinition } from './utils/styles';

/**
 * Configuration options for the Tasty style system
 */
export interface TastyConfig {
  /** CSP nonce for style elements */
  nonce?: string;
  /** Maximum rules per stylesheet (default: 8192) */
  maxRulesPerSheet?: number;
  /** Threshold for bulk cleanup of unused styles (default: 500) */
  unusedStylesThreshold?: number;
  /** Delay before bulk cleanup in ms, ignored if idleCleanup is true (default: 5000) */
  bulkCleanupDelay?: number;
  /** Use requestIdleCallback for cleanup when available (default: true) */
  idleCleanup?: boolean;
  /** Force text injection mode, auto-detected in test environments (default: auto) */
  forceTextInjection?: boolean;
  /** Enable development mode features: performance metrics and debug info (default: auto) */
  devMode?: boolean;
  /**
   * Ratio of unused styles to delete per bulk cleanup run (0..1).
   * Defaults to 0.5 (oldest half) to reduce risk of removing styles
   * that may be restored shortly after being marked unused.
   */
  bulkCleanupBatchRatio?: number;
  /**
   * Minimum age (in ms) a style must remain unused before eligible for deletion.
   * Helps avoid races during rapid mount/unmount cycles. Default: 10000ms.
   */
  unusedStylesMinAgeMs?: number;
  /**
   * Global predefined states for advanced state mapping.
   * These are state aliases that can be used in any component.
   * Example: { '@mobile': '@media(w < 920px)', '@dark': '@root(theme=dark)' }
   */
  states?: Record<string, string>;
  /**
   * Parser LRU cache size (default: 1000).
   * Larger values improve performance for apps with many unique style values.
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
   * Plugins that extend tasty with custom functions, units, or states.
   * Plugins are processed in order, with later plugins overriding earlier ones.
   * @example
   * ```ts
   * import { okhslPlugin } from '@cube-dev/ui-kit/tasty/plugins';
   *
   * configure({
   *   plugins: [okhslPlugin()],
   * });
   * ```
   */
  plugins?: TastyPlugin[];
  /**
   * Global keyframes definitions that can be referenced by animation names in styles.
   * Keys are animation names, values are keyframes step definitions.
   * Keyframes are only injected when actually used in styles.
   * @example
   * ```ts
   * configure({
   *   keyframes: {
   *     fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
   *     pulse: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
   *   },
   * });
   * ```
   */
  keyframes?: Record<string, KeyframesSteps>;
  /**
   * Global CSS @property definitions for custom properties.
   * Keys use tasty token syntax ($name for properties, #name for colors).
   * Properties are only injected when the component using them is rendered.
   *
   * For color tokens (#name), `syntax: '<color>'` is auto-set and
   * `initialValue` defaults to `'transparent'` if not specified.
   *
   * @example
   * ```ts
   * configure({
   *   properties: {
   *     '$rotation': { syntax: '<angle>', initialValue: '0deg' },
   *     '$scale': { syntax: '<number>', inherits: false, initialValue: 1 },
   *     '#accent': { initialValue: 'purple' }, // syntax: '<color>' auto-set
   *   },
   * });
   *
   * // Now use in styles - properties are registered when component renders:
   * const Spinner = tasty({
   *   styles: {
   *     transform: 'rotate($rotation)',
   *     transition: '$$rotation 0.3s', // outputs: --rotation 0.3s
   *   },
   * });
   * ```
   */
  properties?: Record<string, PropertyDefinition>;
  /**
   * Custom style handlers that transform style properties into CSS declarations.
   * Handlers replace built-in handlers for the same style name.
   * @example
   * ```ts
   * import { styleHandlers } from '@cube-dev/ui-kit';
   *
   * configure({
   *   handlers: {
   *     // Override fill with custom behavior
   *     fill: ({ fill }) => {
   *       if (fill?.startsWith('gradient:')) {
   *         return { background: fill.slice(9) };
   *       }
   *       return styleHandlers.fill({ fill });
   *     },
   *     // Add new custom style
   *     elevation: ({ elevation }) => {
   *       const level = parseInt(elevation) || 1;
   *       return {
   *         'box-shadow': `0 ${level * 2}px ${level * 4}px rgba(0,0,0,0.1)`,
   *         'z-index': String(level * 100),
   *       };
   *     },
   *   },
   * });
   * ```
   */
  handlers?: Record<string, StyleHandlerDefinition>;
  /**
   * Predefined tokens that are replaced during style parsing.
   * Token values are processed through the parser (like component tokens).
   * Use `$name` for custom properties and `#name` for color tokens.
   *
   * For color tokens (#name), boolean `true` is converted to `transparent`.
   *
   * @example
   * ```ts
   * configure({
   *   tokens: {
   *     $spacing: '2x',
   *     '$card-padding': '4x',
   *     '#accent': '#purple',
   *     '#surface': '#white',
   *     '#overlay': true, // → transparent
   *   },
   * });
   *
   * // Now use in styles - tokens are replaced at parse time:
   * const Card = tasty({
   *   styles: {
   *     padding: '$card-padding',  // → calc(4 * var(--gap))
   *     fill: '#surface',          // → var(--white-color)
   *   },
   * });
   * ```
   */
  tokens?: {
    [key: `$${string}`]: string | number | boolean;
  } & {
    [key: `#${string}`]: string | number | boolean;
  };
  /**
   * Predefined style recipes -- named style bundles that can be applied via `recipe` style property.
   * Recipe values are flat tasty styles (no sub-element keys). They may contain base styles,
   * tokens (`$name`/`#name` definitions), local states, `@keyframes`, and `@properties`.
   *
   * Components reference recipes via: `recipe: 'name1 name2'` in their styles.
   * Use `|` to separate base recipes from post recipes: `recipe: 'base1 base2 | post1'`.
   * Resolution order: `base_recipes → component styles → post_recipes`.
   *
   * Recipes cannot reference other recipes.
   *
   * @example
   * ```ts
   * configure({
   *   recipes: {
   *     card: { padding: '4x', fill: '#surface', radius: '1r', border: true },
   *     elevated: { shadow: '2x 2x 4x #shadow' },
   *   },
   * });
   *
   * // Usage in styles:
   * const Card = tasty({
   *   styles: {
   *     recipe: 'card elevated',
   *     color: '#text', // Overrides recipe values
   *   },
   * });
   * ```
   */
  recipes?: Record<string, RecipeStyles>;
}

// Warnings tracking to avoid duplicates
const emittedWarnings = new Set<string>();

const devMode = isDevEnv();

/**
 * Emit a warning only once
 */
function warnOnce(key: string, message: string): void {
  if (devMode && !emittedWarnings.has(key)) {
    emittedWarnings.add(key);
    console.warn(message);
  }
}

// ============================================================================
// Configuration State
// ============================================================================

// Track whether styles have been generated (locks configuration)
let stylesGenerated = false;

// Current configuration (null until first configure() or auto-configured on first use)
let currentConfig: TastyConfig | null = null;

// Global keyframes storage (null = no keyframes configured, empty object checked via hasGlobalKeyframes)
let globalKeyframes: Record<string, KeyframesSteps> | null = null;

// Global properties storage (null = no properties configured)
let globalProperties: Record<string, PropertyDefinition> | null = null;

// Global recipes storage (null = no recipes configured)
let globalRecipes: Record<string, RecipeStyles> | null = null;

/**
 * Internal properties required by tasty core features.
 * These are always injected when styles are first generated.
 * Keys use tasty token syntax (#name for colors, $name for other properties).
 *
 * For properties with CSS @property-compatible types (length, time, number, color),
 * an `initialValue` is provided so the property works even without a project-level token.
 */
export const INTERNAL_PROPERTIES: Record<string, PropertyDefinition> = {
  // Used by dual-fill feature to enable CSS transitions on the second fill color
  '#tasty-second-fill': {
    inherits: false,
    initialValue: 'transparent',
  },
  // Current color context variable (set by the color style handler).
  // Companion --current-color-rgb is auto-created.
  '#current': {
    inherits: true,
    initialValue: 'transparent',
  },
  // White and black are fundamental colors that need explicit initial values.
  // Companion -rgb properties are auto-created from the color initial values.
  '#white': {
    inherits: true,
    initialValue: 'rgb(255 255 255)',
  },
  '#black': {
    inherits: true,
    initialValue: 'rgb(0 0 0)',
  },

  // ---- Core design tokens used by style handlers ----
  // These provide sensible defaults so tasty works standalone without a design system.
  // Consuming projects (e.g. uikit) override these by defining tokens on :root.

  $gap: {
    syntax: '<length>',
    inherits: true,
    initialValue: '4px',
  },
  $radius: {
    syntax: '<length>',
    inherits: true,
    initialValue: '6px',
  },
  '$border-width': {
    syntax: '<length>',
    inherits: true,
    initialValue: '1px',
  },
  '$outline-width': {
    syntax: '<length>',
    inherits: true,
    initialValue: '3px',
  },
  $transition: {
    syntax: '<time>',
    inherits: true,
    initialValue: '80ms',
  },
  // Used by radius.ts for `radius="leaf"` modifier
  '$sharp-radius': {
    syntax: '<length>',
    inherits: true,
    initialValue: '0px',
  },
  // Used by preset.ts for `preset="... strong"`
  '$bold-font-weight': {
    syntax: '<number>',
    inherits: true,
    initialValue: '700',
  },
};

/**
 * Internal token defaults that cannot be expressed as CSS @property initial values
 * (e.g. font stacks, keyword colors). These are injected as :root CSS variables.
 * Consuming projects override them by setting their own tokens on :root.
 *
 * Keys are raw CSS custom property names (--name).
 */
export const INTERNAL_TOKENS: Record<string, string> = {
  '--font':
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
  '--monospace-font':
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  // Default border color to the element's current text color
  '--border-color': 'currentColor',
};

// Global injector instance key
const GLOBAL_INJECTOR_KEY = '__TASTY_GLOBAL_INJECTOR__';

declare global {
  interface Window {
    [GLOBAL_INJECTOR_KEY]?: import('./injector/injector').StyleInjector;
  }
}

/**
 * Detect if we're running in a test environment
 */
export function isTestEnvironment(): boolean {
  // Check Node.js environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return true;
  }

  // Check for test runner globals (safely)
  if (typeof global !== 'undefined') {
    const g = global as any;
    if (g.vi || g.jest || g.expect || g.describe || g.it) {
      return true;
    }
  }

  // Check for jsdom environment (common in tests)
  if (
    typeof window !== 'undefined' &&
    window.navigator?.userAgent?.includes('jsdom')
  ) {
    return true;
  }

  // Check for other test runners
  if (typeof globalThis !== 'undefined') {
    const gt = globalThis as any;
    if (gt.vitest || gt.mocha) {
      return true;
    }
  }

  return false;
}

/**
 * Create default configuration with optional test environment detection
 */
function createDefaultConfig(isTest?: boolean): TastyConfig {
  return {
    maxRulesPerSheet: 8192,
    unusedStylesThreshold: 500,
    bulkCleanupDelay: 5000,
    idleCleanup: true,
    forceTextInjection: isTest ?? false,
    devMode: isDevEnv(),
    bulkCleanupBatchRatio: 0.5,
    unusedStylesMinAgeMs: 10000,
  };
}

// ============================================================================
// stylesGenerated Flag Management
// ============================================================================

/**
 * Mark that styles have been generated (called by injector on first inject)
 * This locks the configuration - no further changes allowed.
 * Also injects internal and global properties.
 */
export function markStylesGenerated(): void {
  if (stylesGenerated) return; // Already marked, skip

  stylesGenerated = true;

  const injector = getGlobalInjector();

  // Inject internal properties required by tasty core features
  for (const [token, definition] of Object.entries(INTERNAL_PROPERTIES)) {
    injector.property(token, definition);
  }

  // Inject internal token defaults as :root CSS variables.
  // Use injectGlobal (not injectRawCSS) so the rule goes through the same
  // injection path as all other tasty styles (consistent in both DOM and text/test mode).
  const internalTokenEntries = Object.entries(INTERNAL_TOKENS);
  if (internalTokenEntries.length > 0) {
    const declarations = internalTokenEntries
      .map(([name, value]) => `${name}: ${value}`)
      .join('; ');
    injector.injectGlobal([{ selector: ':root', declarations }]);
  }

  // Inject global properties if any were configured
  // Properties are permanent and only need to be injected once
  if (globalProperties && Object.keys(globalProperties).length > 0) {
    for (const [token, definition] of Object.entries(globalProperties)) {
      injector.property(token, definition);
    }
  }
}

/**
 * Check if styles have been generated (configuration is locked)
 */
export function hasStylesGenerated(): boolean {
  return stylesGenerated;
}

/**
 * Reset styles generated flag (for testing only)
 */
export function resetStylesGenerated(): void {
  stylesGenerated = false;
  emittedWarnings.clear();
}

// ============================================================================
// Global Keyframes Management
// ============================================================================

/**
 * Check if any global keyframes are configured.
 * Fast path: returns false if no keyframes were ever set.
 */
export function hasGlobalKeyframes(): boolean {
  return globalKeyframes !== null && Object.keys(globalKeyframes).length > 0;
}

/**
 * Get global keyframes configuration.
 * Returns null if no keyframes configured (fast path for zero-overhead).
 */
export function getGlobalKeyframes(): Record<string, KeyframesSteps> | null {
  return globalKeyframes;
}

/**
 * Set global keyframes (called from configure).
 * Internal use only.
 */
function setGlobalKeyframes(keyframes: Record<string, KeyframesSteps>): void {
  if (stylesGenerated) {
    warnOnce(
      'keyframes-after-styles',
      `[Tasty] Cannot update keyframes after styles have been generated.\n` +
        `The new keyframes will be ignored.`,
    );
    return;
  }
  globalKeyframes = keyframes;
}

// ============================================================================
// Global Properties Management
// ============================================================================

/**
 * Check if any global properties are configured.
 * Fast path: returns false if no properties were ever set.
 */
export function hasGlobalProperties(): boolean {
  return globalProperties !== null && Object.keys(globalProperties).length > 0;
}

/**
 * Get global properties configuration.
 * Returns null if no properties configured (fast path for zero-overhead).
 */
export function getGlobalProperties(): Record<
  string,
  PropertyDefinition
> | null {
  return globalProperties;
}

/**
 * Set global properties (called from configure).
 * Internal use only.
 */
function setGlobalProperties(
  properties: Record<string, PropertyDefinition>,
): void {
  if (stylesGenerated) {
    warnOnce(
      'properties-after-styles',
      `[Tasty] Cannot update properties after styles have been generated.\n` +
        `The new properties will be ignored.`,
    );
    return;
  }
  globalProperties = properties;
}

// ============================================================================
// Global Recipes Management
// ============================================================================

/**
 * Check if any global recipes are configured.
 * Fast path: returns false if no recipes were ever set.
 */
export function hasGlobalRecipes(): boolean {
  return globalRecipes !== null && Object.keys(globalRecipes).length > 0;
}

/**
 * Get global recipes configuration.
 * Returns null if no recipes configured (fast path for zero-overhead).
 */
export function getGlobalRecipes(): Record<string, RecipeStyles> | null {
  return globalRecipes;
}

/**
 * Set global recipes (called from configure).
 * Internal use only.
 */
function setGlobalRecipes(recipes: Record<string, RecipeStyles>): void {
  if (stylesGenerated) {
    warnOnce(
      'recipes-after-styles',
      `[Tasty] Cannot update recipes after styles have been generated.\n` +
        `The new recipes will be ignored.`,
    );
    return;
  }

  // Dev-mode validation
  if (devMode) {
    for (const [name, recipeStyles] of Object.entries(recipes)) {
      for (const key of Object.keys(recipeStyles)) {
        if (isSelector(key)) {
          warnOnce(
            `recipe-selector-${name}-${key}`,
            `[Tasty] Recipe "${name}" contains sub-element key "${key}". ` +
              `Recipes must be flat styles without sub-element keys. ` +
              `Remove the sub-element key from the recipe definition.`,
          );
        }
        if (key === 'recipe') {
          warnOnce(
            `recipe-recursive-${name}`,
            `[Tasty] Recipe "${name}" contains a "recipe" key. ` +
              `Recipes cannot reference other recipes. ` +
              `Use space-separated names for composition: recipe: 'base elevated'.`,
          );
        }
      }
    }
  }

  globalRecipes = recipes;
}

/**
 * Check if configuration is locked (styles have been generated)
 */
export function isConfigLocked(): boolean {
  return stylesGenerated;
}

// ============================================================================
// Configuration API
// ============================================================================

/**
 * Configure the Tasty style system.
 *
 * Must be called BEFORE any styles are generated (before first render that uses tasty).
 * After styles are generated, configuration is locked and calls to configure() will
 * emit a warning and be ignored.
 *
 * @example
 * ```ts
 * import { configure } from '@cube-dev/ui-kit';
 *
 * // Configure before app renders
 * configure({
 *   nonce: 'abc123',
 *   states: {
 *     '@mobile': '@media(w < 768px)',
 *     '@dark': '@root(theme=dark)',
 *   },
 * });
 * ```
 */
export function configure(config: Partial<TastyConfig> = {}): void {
  if (stylesGenerated) {
    warnOnce(
      'configure-after-styles',
      `[Tasty] Cannot call configure() after styles have been generated.\n` +
        `Configuration must be done before the first render. The configuration will be ignored.`,
    );
    return;
  }

  // Collect merged values from plugins first, then override with direct config
  let mergedStates: Record<string, string> = {};
  let mergedUnits: Record<string, string | UnitHandler> = {};
  let mergedFuncs: Record<string, (groups: StyleDetails[]) => string> = {};
  let mergedHandlers: Record<string, StyleHandlerDefinition> = {};
  let mergedTokens: Record<string, string | number | boolean> = {};
  let mergedRecipes: Record<string, RecipeStyles> = {};

  // Process plugins in order
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (plugin.states) {
        mergedStates = { ...mergedStates, ...plugin.states };
      }
      if (plugin.units) {
        mergedUnits = { ...mergedUnits, ...plugin.units };
      }
      if (plugin.funcs) {
        mergedFuncs = { ...mergedFuncs, ...plugin.funcs };
      }
      if (plugin.handlers) {
        mergedHandlers = { ...mergedHandlers, ...plugin.handlers };
      }
      if (plugin.tokens) {
        mergedTokens = { ...mergedTokens, ...plugin.tokens };
      }
      if (plugin.recipes) {
        mergedRecipes = { ...mergedRecipes, ...plugin.recipes };
      }
    }
  }

  // Direct config overrides plugins
  if (config.states) {
    mergedStates = { ...mergedStates, ...config.states };
  }
  if (config.units) {
    mergedUnits = { ...mergedUnits, ...config.units };
  }
  if (config.funcs) {
    mergedFuncs = { ...mergedFuncs, ...config.funcs };
  }
  if (config.handlers) {
    mergedHandlers = { ...mergedHandlers, ...config.handlers };
  }
  if (config.tokens) {
    mergedTokens = { ...mergedTokens, ...config.tokens };
  }
  if (config.recipes) {
    mergedRecipes = { ...mergedRecipes, ...config.recipes };
  }

  // Handle predefined states
  if (Object.keys(mergedStates).length > 0) {
    setGlobalPredefinedStates(mergedStates);
  }

  // Handle parser configuration (merge semantics - extend, not replace)
  const parser = getGlobalParser();

  if (config.parserCacheSize !== undefined) {
    parser.updateOptions({ cacheSize: config.parserCacheSize });
  }

  if (Object.keys(mergedUnits).length > 0) {
    // Merge with existing units
    const currentUnits = parser.getUnits() ?? CUSTOM_UNITS;
    parser.setUnits({ ...currentUnits, ...mergedUnits });
  }

  if (Object.keys(mergedFuncs).length > 0) {
    // Merge with existing funcs
    const currentFuncs = getGlobalFuncs();
    const finalFuncs = { ...currentFuncs, ...mergedFuncs };
    parser.setFuncs(finalFuncs);
    // Also update the global registry so customFunc() continues to work
    Object.assign(currentFuncs, mergedFuncs);
  }

  // Handle keyframes
  if (config.keyframes) {
    setGlobalKeyframes(config.keyframes);
  }

  // Handle properties
  if (config.properties) {
    setGlobalProperties(config.properties);
  }

  // Handle custom handlers
  if (Object.keys(mergedHandlers).length > 0) {
    for (const [name, definition] of Object.entries(mergedHandlers)) {
      const handler = normalizeHandlerDefinition(name, definition);
      registerHandler(handler);
    }
  }

  // Handle predefined tokens
  // Note: Tokens are processed by the classifier, not here.
  // We just store the raw values; the classifier will process them when encountered.
  if (Object.keys(mergedTokens).length > 0) {
    // Store tokens (keys are normalized to lowercase by setGlobalPredefinedTokens)
    const processedTokens: Record<string, string> = {};
    for (const [key, value] of Object.entries(mergedTokens)) {
      if (key.startsWith('#')) {
        // Color token - use shared helper for boolean handling
        const normalized = normalizeColorTokenValue(value);
        if (normalized === null) continue; // Skip false values
        processedTokens[key] = String(normalized);
      } else if (value === false) {
        // Skip false values for non-color tokens
        continue;
      } else {
        processedTokens[key] = String(value);
      }
    }
    setGlobalPredefinedTokens(processedTokens);
  }

  // Handle recipes
  if (Object.keys(mergedRecipes).length > 0) {
    setGlobalRecipes(mergedRecipes);
  }

  // Create config without states, parser options, plugins, keyframes, properties, handlers, tokens, and recipes (handled separately)
  const {
    states: _states,
    parserCacheSize: _parserCacheSize,
    units: _units,
    funcs: _funcs,
    plugins: _plugins,
    keyframes: _keyframes,
    properties: _properties,
    handlers: _handlers,
    tokens: _tokens,
    recipes: _recipes,
    ...injectorConfig
  } = config;

  const fullConfig: TastyConfig = {
    ...createDefaultConfig(),
    ...currentConfig,
    ...injectorConfig,
  };

  // Store the config
  currentConfig = fullConfig;

  // Create/replace the global injector
  const storage = typeof window !== 'undefined' ? window : (globalThis as any);
  storage[GLOBAL_INJECTOR_KEY] = new StyleInjector(fullConfig);
}

/**
 * Get the current configuration.
 * If not configured, returns default configuration.
 */
export function getConfig(): TastyConfig {
  if (!currentConfig) {
    currentConfig = createDefaultConfig(isTestEnvironment());
  }
  return currentConfig;
}

/**
 * Get the global injector instance.
 * Auto-configures with defaults if not already configured.
 */
export function getGlobalInjector(): import('./injector/injector').StyleInjector {
  const storage = typeof window !== 'undefined' ? window : (globalThis as any);

  if (!storage[GLOBAL_INJECTOR_KEY]) {
    configure();
  }

  return storage[GLOBAL_INJECTOR_KEY]!;
}

/**
 * Reset configuration (for testing only).
 * Clears the global injector and allows reconfiguration.
 */
export function resetConfig(): void {
  stylesGenerated = false;
  currentConfig = null;
  globalKeyframes = null;
  globalProperties = null;
  globalRecipes = null;
  resetGlobalPredefinedTokens();
  resetHandlers();
  clearPipelineCache();
  emittedWarnings.clear();

  const storage = typeof window !== 'undefined' ? window : (globalThis as any);
  delete storage[GLOBAL_INJECTOR_KEY];
}

// Re-export TastyConfig as StyleInjectorConfig for backward compatibility
export type { TastyConfig as StyleInjectorConfig };
