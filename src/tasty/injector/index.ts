import {
  getConfig,
  getGlobalInjector,
  isTestEnvironment,
  markStylesGenerated,
} from '../config';
import { StyleResult } from '../pipeline';

import { StyleInjector } from './injector';
import {
  DisposeFunction,
  GlobalInjectResult,
  InjectResult,
  StyleInjectorConfig,
} from './types';

/**
 * Allocate a className for a cacheKey without injecting styles yet
 */
export function allocateClassName(
  cacheKey: string,
  options?: { root?: Document | ShadowRoot },
): { className: string; isNewAllocation: boolean } {
  return getGlobalInjector().allocateClassName(cacheKey, options);
}

/**
 * Inject styles and return className with dispose function
 */
export function inject(
  rules: StyleResult[],
  options?: { root?: Document | ShadowRoot; cacheKey?: string },
): InjectResult {
  // Mark that styles have been generated (prevents configuration changes)
  markStylesGenerated();

  return getGlobalInjector().inject(rules, options);
}

/**
 * Inject global rules that should not reserve tasty class names
 */
export function injectGlobal(
  rules: StyleResult[],
  options?: { root?: Document | ShadowRoot },
): GlobalInjectResult {
  return getGlobalInjector().injectGlobal(rules, options);
}

/**
 * Internal method for createGlobalStyle - not exported publicly
 */
function injectCreateGlobalStyle(
  rules: StyleResult[],
  options?: { root?: Document | ShadowRoot },
): GlobalInjectResult {
  return getGlobalInjector().injectCreateGlobalStyle(rules, options);
}

/**
 * Inject keyframes and return object with toString() and dispose()
 */
export function keyframes(
  steps: import('./types').KeyframesSteps,
  nameOrOptions?: string | { root?: Document | ShadowRoot; name?: string },
): import('./types').KeyframesResult {
  return getGlobalInjector().keyframes(steps, nameOrOptions);
}

/**
 * Get CSS text from all sheets (for SSR)
 */
export function getCssText(options?: { root?: Document | ShadowRoot }): string {
  return getGlobalInjector().getCssText(options);
}

/**
 * Collect only CSS used by a rendered subtree (like jest-styled-components).
 * Pass the container returned by render(...).
 */
export function getCssTextForNode(
  node: ParentNode | Element | DocumentFragment,
  options?: { root?: Document | ShadowRoot },
): string {
  // Collect tasty-generated class names (t<number>) from the subtree
  const classSet = new Set<string>();

  const readClasses = (el: Element) => {
    const cls = el.getAttribute('class');
    if (!cls) return;
    for (const token of cls.split(/\s+/)) {
      if (/^t\d+$/.test(token)) classSet.add(token);
    }
  };

  // Include node itself if it's an Element
  if ((node as Element).getAttribute) {
    readClasses(node as Element);
  }
  // Walk descendants
  const elements = (node as ParentNode).querySelectorAll
    ? (node as ParentNode).querySelectorAll('[class]')
    : ([] as unknown as NodeListOf<Element>);
  elements && elements.forEach(readClasses);

  return getGlobalInjector().getCssTextForClasses(classSet, options);
}

/**
 * Force cleanup of unused rules
 */
export function cleanup(root?: Document | ShadowRoot): void {
  return getGlobalInjector().cleanup(root);
}

/**
 * Check if we're currently running in a test environment
 */
export function getIsTestEnvironment(): boolean {
  return isTestEnvironment();
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
  const defaultConfig = getConfig();

  const fullConfig: StyleInjectorConfig = {
    ...defaultConfig,
    // Auto-enable forceTextInjection in test environments
    forceTextInjection: config.forceTextInjection ?? isTestEnvironment(),
    ...config,
  };

  return new StyleInjector(fullConfig);
}

/**
 * Create a global style component like styled-components createGlobalStyle
 * Returns a React component that injects global styles when mounted and cleans up when unmounted
 */
export function createGlobalStyle<Props = {}>(
  strings: TemplateStringsArray,
  ...interpolations: Array<
    string | number | ((props: Props) => string | number)
  >
): import('react').ComponentType<Props & { root?: Document | ShadowRoot }> {
  return getGlobalInjector().createGlobalStyle(strings, ...interpolations);
}

// Re-export types
export type {
  StyleInjectorConfig,
  InjectResult,
  DisposeFunction,
  RuleInfo,
  SheetInfo,
  RootRegistry,
  StyleRule,
  KeyframesInfo,
  KeyframesResult,
  KeyframesSteps,
  KeyframesCacheEntry,
  CacheMetrics,
} from './types';

export { StyleInjector } from './injector';
export { SheetManager } from './sheet-manager';
