import { StyleResult } from '../utils/renderStyles';

import { StyleInjector } from './injector';
import { DisposeFunction, InjectResult, StyleInjectorConfig } from './types';

// Use a more robust global singleton that survives React Strict Mode
const GLOBAL_INJECTOR_KEY = '__TASTY_GLOBAL_INJECTOR__';

declare global {
  interface Window {
    [GLOBAL_INJECTOR_KEY]?: StyleInjector;
  }
}

/**
 * Configure the global style injector
 */
export function configure(config: Partial<StyleInjectorConfig> = {}): void {
  const fullConfig: StyleInjectorConfig = {
    maxRulesPerSheet: undefined, // infinite by default
    gcThreshold: 100,
    useAdoptedStyleSheets: false, // default to style tags
    cacheSize: 1000, // LRU cache size
    ...config,
  };

  // Store on window to survive React Strict Mode resets
  if (typeof window !== 'undefined') {
    window[GLOBAL_INJECTOR_KEY] = new StyleInjector(fullConfig);
  } else {
    // Fallback for SSR
    (globalThis as any)[GLOBAL_INJECTOR_KEY] = new StyleInjector(fullConfig);
  }
}

/**
 * Get or create the global injector instance
 */
function getGlobalInjector(): StyleInjector {
  const storage = typeof window !== 'undefined' ? window : (globalThis as any);

  if (!storage[GLOBAL_INJECTOR_KEY]) {
    configure();
  }
  return storage[GLOBAL_INJECTOR_KEY]!;
}

/**
 * Inject styles and return className with dispose function
 */
export function inject(
  rules: StyleResult[],
  options?: { root?: Document | ShadowRoot },
): InjectResult {
  return getGlobalInjector().inject(rules, options);
}

/**
 * Inject global CSS rule (legacy method - not supported in direct injector)
 */
export function injectGlobal(
  selector: string,
  cssText: string,
  options?: { root?: Document | ShadowRoot },
): DisposeFunction {
  console.warn(
    'injectGlobal is not supported in the direct style injector. Use inject() with pre-processed rules instead.',
  );
  return () => {};
}

/**
 * Get CSS text from all sheets (for SSR)
 */
export function getCssText(options?: { root?: Document | ShadowRoot }): string {
  return getGlobalInjector().getCssText(options);
}

/**
 * Force cleanup of unused rules
 */
export function cleanup(root?: Document | ShadowRoot): void {
  return getGlobalInjector().cleanup(root);
}

/**
 * Get the global injector instance for debugging
 */
export const injector = {
  get instance() {
    return getGlobalInjector();
  },
};

/**
 * Destroy all resources and clean up
 */
export function destroy(root?: Document | ShadowRoot): void {
  return getGlobalInjector().destroy(root);
}

/**
 * Create a new isolated injector instance
 */
export function createInjector(
  config: Partial<StyleInjectorConfig> = {},
): StyleInjector {
  const fullConfig: StyleInjectorConfig = {
    maxRulesPerSheet: undefined,
    gcThreshold: 100,
    useAdoptedStyleSheets: false, // default to style tags
    cacheSize: 1000, // LRU cache size
    ...config,
  };

  return new StyleInjector(fullConfig);
}

// Re-export types
export type {
  StyleInjectorConfig,
  InjectResult,
  DisposeFunction,
  RuleInfo,
  SheetInfo,
  RootRegistry,
  FlattenedRule,
  KeyframesInfo,
} from './types';

export { StyleInjector } from './injector';
export { SheetManager } from './sheet-manager';
export { flattenNestedCss } from './flatten';
export { hashCssText } from './hash';
