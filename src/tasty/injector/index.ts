import { StyleInjector } from './injector';
import { DisposeFunction, InjectResult, StyleInjectorConfig } from './types';

let globalInjector: StyleInjector | null = null;

/**
 * Configure the global style injector
 */
export function configure(config: Partial<StyleInjectorConfig> = {}): void {
  const fullConfig: StyleInjectorConfig = {
    maxRulesPerSheet: undefined, // infinite by default
    gcThreshold: 100,
    useAdoptedStyleSheets: true,
    ...config,
  };

  globalInjector = new StyleInjector(fullConfig);
}

/**
 * Get or create the global injector instance
 */
function getGlobalInjector(): StyleInjector {
  if (!globalInjector) {
    configure();
  }
  return globalInjector!;
}

/**
 * Inject CSS and return className with dispose function
 */
export function inject(
  cssText: string,
  options?: { root?: Document | ShadowRoot },
): InjectResult {
  return getGlobalInjector().inject(cssText, options);
}

/**
 * Inject global CSS rule
 */
export function injectGlobal(
  selector: string,
  cssText: string,
  options?: { root?: Document | ShadowRoot },
): DisposeFunction {
  return getGlobalInjector().injectGlobal(selector, cssText, options);
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
    useAdoptedStyleSheets: true,
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
  AtomicRule,
} from './types';

export { StyleInjector } from './injector';
export { SheetManager } from './sheet-manager';
export { flattenNestedCss } from './flatten';
export { hashCssText, hashAtomicValue, hashSelector } from './hash';
