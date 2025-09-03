import { isDevEnv } from '../utils/isDevEnv';
import { StyleResult } from '../utils/renderStyles';

import { StyleInjector } from './injector';
import {
  DisposeFunction,
  GlobalInjectResult,
  InjectResult,
  StyleInjectorConfig,
} from './types';

// Use a more robust global singleton that survives React Strict Mode
const GLOBAL_INJECTOR_KEY = '__TASTY_GLOBAL_INJECTOR__';

declare global {
  interface Window {
    [GLOBAL_INJECTOR_KEY]?: StyleInjector;
  }
}

/**
 * Detect if we're running in a test environment
 */
function isTestEnvironment(): boolean {
  // Check Node.js environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return true;
  }

  // Check for Jest globals (safely)
  if (typeof global !== 'undefined') {
    const g = global as any;
    if (g.jest || g.expect || g.describe || g.it) {
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
 * Configure the global style injector
 */
export function configure(config: Partial<StyleInjectorConfig> = {}): void {
  const fullConfig: StyleInjectorConfig = {
    maxRulesPerSheet: 8192, // safer default cap per sheet
    unusedStylesThreshold: 200, // default threshold for bulk cleanup of unused styles
    bulkCleanupDelay: 5000, // default delay before bulk cleanup (ignored if idleCleanup is true)
    idleCleanup: true, // default to using requestIdleCallback instead of setTimeout
    forceTextInjection: false, // auto-enable for test environments
    devMode: isDevEnv(), // enable dev features: performance tracking and debug info
    bulkCleanupBatchRatio: 0.5,
    unusedStylesMinAgeMs: 10000,
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
  options?: { root?: Document | ShadowRoot; cacheKey?: string },
): InjectResult {
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
  const isTest = isTestEnvironment();

  const fullConfig: StyleInjectorConfig = {
    maxRulesPerSheet: 8192, // safer default cap per sheet
    unusedStylesThreshold: 500, // default threshold for bulk cleanup of unused styles
    bulkCleanupDelay: 5000, // default delay before bulk cleanup (ignored if idleCleanup is true)
    idleCleanup: true, // default to using requestIdleCallback instead of setTimeout
    forceTextInjection: isTest, // auto-enable for test environments
    devMode: isDevEnv(), // enable dev features: performance tracking and debug info
    bulkCleanupBatchRatio: 0.5,
    unusedStylesMinAgeMs: 10000,
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
