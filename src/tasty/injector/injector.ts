/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { StyleResult } from '../pipeline';
import {
  getEffectiveDefinition,
  normalizePropertyDefinition,
} from '../properties';
import { isDevEnv } from '../utils/isDevEnv';
import { parseStyle } from '../utils/styles';

import { SheetManager } from './sheet-manager';
import {
  GlobalInjectResult,
  InjectResult,
  KeyframesResult,
  KeyframesSteps,
  PropertyDefinition,
  RawCSSResult,
  StyleInjectorConfig,
  StyleRule,
} from './types';

/**
 * Generate sequential class name with format t{number}
 */
function generateClassName(counter: number): string {
  return `t${counter}`;
}

export class StyleInjector {
  private sheetManager: SheetManager;
  private config: StyleInjectorConfig;
  private cleanupScheduled = false;
  private globalRuleCounter = 0;

  constructor(config: StyleInjectorConfig = {}) {
    this.config = config;
    this.sheetManager = new SheetManager(config);
  }

  /**
   * Allocate a className for a cacheKey without injecting styles yet.
   * This allows separating className allocation (render phase) from style injection (insertion phase).
   */
  allocateClassName(
    cacheKey: string,
    options?: { root?: Document | ShadowRoot },
  ): { className: string; isNewAllocation: boolean } {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    // Check if we can reuse existing className for this cache key
    if (registry.cacheKeyToClassName.has(cacheKey)) {
      const className = registry.cacheKeyToClassName.get(cacheKey)!;
      return {
        className,
        isNewAllocation: false,
      };
    }

    // Generate new className and reserve it
    const className = generateClassName(registry.classCounter++);

    // Create placeholder RuleInfo to reserve the className
    const placeholderRuleInfo = {
      className,
      ruleIndex: -1, // Placeholder - will be set during actual injection
      sheetIndex: -1, // Placeholder - will be set during actual injection
    };

    // Store RuleInfo only once by className, and map cacheKey separately
    registry.rules.set(className, placeholderRuleInfo);
    registry.cacheKeyToClassName.set(cacheKey, className);

    return {
      className,
      isNewAllocation: true,
    };
  }

  /**
   * Inject styles from StyleResult objects
   */
  inject(
    rules: StyleResult[],
    options?: { root?: Document | ShadowRoot; cacheKey?: string },
  ): InjectResult {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (rules.length === 0) {
      return {
        className: '',
        dispose: () => {},
      };
    }

    // Rules are now in StyleRule format directly

    // Check if we can reuse based on cache key
    const cacheKey = options?.cacheKey;
    let className: string;
    let isPreAllocated = false;

    if (cacheKey && registry.cacheKeyToClassName.has(cacheKey)) {
      // Reuse existing class for this cache key
      className = registry.cacheKeyToClassName.get(cacheKey)!;
      const existingRuleInfo = registry.rules.get(className)!;

      // Check if this is a placeholder (pre-allocated but not yet injected)
      isPreAllocated =
        existingRuleInfo.ruleIndex === -1 && existingRuleInfo.sheetIndex === -1;

      if (!isPreAllocated) {
        // Already injected - just increment refCount
        const currentRefCount = registry.refCounts.get(className) || 0;
        registry.refCounts.set(className, currentRefCount + 1);

        // Update metrics
        if (registry.metrics) {
          registry.metrics.hits++;
        }

        return {
          className,
          dispose: () => this.dispose(className, registry),
        };
      }
    } else {
      // Generate new className
      className = generateClassName(registry.classCounter++);
    }

    // Process rules: handle needsClassName flag and apply specificity
    const rulesToInsert = rules.map((rule) => {
      let newSelector = rule.selector;

      // If rule needs className prepended
      if (rule.needsClassName) {
        // Handle multiple selectors (separated by ||| for OR conditions)
        const selectorParts = newSelector ? newSelector.split('|||') : [''];

        const classPrefix = `.${className}.${className}`;

        newSelector = selectorParts
          .map((part) => {
            const classSelector = part ? `${classPrefix}${part}` : classPrefix;

            // If there's a root prefix, add it before the class selector
            if (rule.rootPrefix) {
              return `${rule.rootPrefix} ${classSelector}`;
            }
            return classSelector;
          })
          .join(', ');
      }

      return {
        ...rule,
        selector: newSelector,
        needsClassName: undefined, // Remove the flag after processing
        rootPrefix: undefined, // Remove rootPrefix after processing
      };
    });

    // Before inserting, auto-register @property for any color custom properties being defined.
    // Fast parse: split declarations by ';' and match "--*-color:"
    // Do this only when we actually insert (i.e., no cache hit above)
    const colorPropRegex = /^\s*(--[a-z0-9-]+-color)\s*:/i;
    for (const rule of rulesToInsert) {
      // Skip if no declarations
      if (!rule.declarations) continue;
      const parts = rule.declarations.split(/;+\s*/);
      for (const part of parts) {
        if (!part) continue;
        const match = colorPropRegex.exec(part);
        if (match) {
          const propName = match[1];
          // Register @property only if not already defined for this root
          if (!this.isPropertyDefined(propName, { root })) {
            this.property(propName, {
              syntax: '<color>',
              initialValue: 'transparent',
              root,
            });
          }
        }
      }
    }

    // Insert rules using existing sheet manager
    const ruleInfo = this.sheetManager.insertRule(
      registry,
      rulesToInsert,
      className,
      root,
    );

    if (!ruleInfo) {
      // Update metrics
      if (registry.metrics) {
        registry.metrics.misses++;
      }

      return {
        className,
        dispose: () => {},
      };
    }

    // Store in registry
    registry.refCounts.set(className, 1);

    if (isPreAllocated) {
      // Update the existing placeholder entry with real rule info
      registry.rules.set(className, ruleInfo);
      // cacheKey mapping already exists from allocation
    } else {
      // Store new entries
      registry.rules.set(className, ruleInfo);
      if (cacheKey) {
        registry.cacheKeyToClassName.set(cacheKey, className);
      }
    }

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalInsertions++;
      registry.metrics.misses++;
    }

    return {
      className,
      dispose: () => this.dispose(className, registry),
    };
  }

  /**
   * Inject global styles (rules without a generated tasty class selector)
   * This ensures we don't reserve a tasty class name (t{number}) for global rules,
   * which could otherwise collide with element-level styles and break lookups.
   */
  injectGlobal(
    rules: StyleResult[],
    options?: { root?: Document | ShadowRoot },
  ): GlobalInjectResult {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (!rules || rules.length === 0) {
      return { dispose: () => {} };
    }

    // Use a non-tasty identifier to avoid any collisions with .t{number} classes
    const key = `global:${this.globalRuleCounter++}`;

    const info = this.sheetManager.insertGlobalRule(
      registry,
      rules as unknown as StyleRule[],
      key,
      root,
    );

    if (registry.metrics) {
      registry.metrics.totalInsertions++;
    }

    return {
      dispose: () => {
        if (info) this.sheetManager.deleteGlobalRule(registry, key);
      },
    };
  }

  /**
   * Inject raw CSS text directly without parsing
   * This is a low-overhead alternative to createGlobalStyle for raw CSS
   * The CSS is inserted into a separate style element to avoid conflicts with tasty's chunking
   */
  injectRawCSS(
    css: string,
    options?: { root?: Document | ShadowRoot },
  ): RawCSSResult {
    const root = options?.root || document;
    return this.sheetManager.injectRawCSS(css, root);
  }

  /**
   * Get raw CSS text for SSR
   */
  getRawCSSText(options?: { root?: Document | ShadowRoot }): string {
    const root = options?.root || document;
    return this.sheetManager.getRawCSSText(root);
  }

  /**
   * Dispose of a className
   */
  private dispose(className: string, registry: any): void {
    const currentRefCount = registry.refCounts.get(className);
    // Guard against stale double-dispose or mismatched lifecycle
    if (currentRefCount == null || currentRefCount <= 0) {
      return;
    }

    const newRefCount = currentRefCount - 1;
    registry.refCounts.set(className, newRefCount);

    if (newRefCount === 0) {
      // Update metrics
      if (registry.metrics) {
        registry.metrics.totalUnused++;
      }

      // Check if cleanup should be scheduled
      this.sheetManager.checkCleanupNeeded(registry);
    }
  }

  /**
   * Force bulk cleanup of unused styles
   */
  cleanup(root?: Document | ShadowRoot): void {
    const registry = this.sheetManager.getRegistry(root || document);
    // Clean up ALL unused rules regardless of batch ratio
    this.sheetManager.forceCleanup(registry);
  }

  /**
   * Get CSS text from all sheets (for SSR)
   */
  getCssText(options?: { root?: Document | ShadowRoot }): string {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    return this.sheetManager.getCssText(registry);
  }

  /**
   * Get CSS only for the provided tasty classNames (e.g., ["t0","t3"])
   */
  getCssTextForClasses(
    classNames: Iterable<string>,
    options?: { root?: Document | ShadowRoot },
  ): string {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    const cssChunks: string[] = [];
    for (const cls of classNames) {
      const info = registry.rules.get(cls);
      if (info) {
        // Always prefer reading from the live stylesheet, since indices can change
        const sheet = registry.sheets[info.sheetIndex];
        const styleSheet = sheet?.sheet?.sheet;
        if (styleSheet) {
          const start = Math.max(0, info.ruleIndex);
          const end = Math.min(
            styleSheet.cssRules.length - 1,
            (info.endRuleIndex as number) ?? info.ruleIndex,
          );
          // Additional validation: ensure indices are valid and in correct order
          if (
            start >= 0 &&
            end >= start &&
            start < styleSheet.cssRules.length
          ) {
            for (let i = start; i <= end; i++) {
              const rule = styleSheet.cssRules[i] as CSSRule | undefined;
              if (rule) cssChunks.push(rule.cssText);
            }
          }
        } else if (info.cssText && info.cssText.length) {
          // Fallback in environments without CSSOM access
          cssChunks.push(...info.cssText);
        }
      }
    }
    return cssChunks.join('\n');
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(options?: { root?: Document | ShadowRoot }): any {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    return this.sheetManager.getMetrics(registry);
  }

  /**
   * Reset cache performance metrics
   */
  resetMetrics(options?: { root?: Document | ShadowRoot }): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    this.sheetManager.resetMetrics(registry);
  }

  /**
   * Define a CSS @property custom property.
   *
   * Accepts tasty token syntax for the property name:
   * - `$name` → defines `--name`
   * - `#name` → defines `--name-color` (auto-sets syntax: '<color>', defaults initialValue: 'transparent')
   * - `--name` → defines `--name` (legacy format)
   *
   * Example:
   * @property --rotation { syntax: "<angle>"; inherits: false; initial-value: 45deg; }
   *
   * Note: No caching or dispose — this defines a global property.
   *
   * If the same property is registered with different options, a warning is emitted
   * but the original definition is preserved (CSS @property cannot be redefined).
   */
  property(
    name: string,
    options?: PropertyDefinition & {
      root?: Document | ShadowRoot;
    },
  ): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    // Parse the token and get effective definition
    // This handles $name, #name, --name formats and auto-sets syntax for colors
    const userDefinition: PropertyDefinition = {
      syntax: options?.syntax,
      inherits: options?.inherits,
      initialValue: options?.initialValue,
    };

    const effectiveResult = getEffectiveDefinition(name, userDefinition);

    if (!effectiveResult.isValid) {
      if (isDevEnv()) {
        console.warn(
          `[Tasty] property(): ${effectiveResult.error}. Got: "${name}"`,
        );
      }
      return;
    }

    const cssName = effectiveResult.cssName;
    const definition = effectiveResult.definition;

    // Normalize the definition for comparison
    const normalizedDef = normalizePropertyDefinition(definition);

    // Check if already defined
    const existingDef = registry.injectedProperties.get(cssName);
    if (existingDef !== undefined) {
      // Property already exists - check if definitions match
      if (existingDef !== normalizedDef) {
        // Different definition - warn but don't replace (CSS @property can't be redefined)
        if (isDevEnv()) {
          console.warn(
            `[Tasty] @property ${cssName} was already defined with a different declaration. ` +
              `The new declaration will be ignored. ` +
              `Original: ${existingDef}, New: ${normalizedDef}`,
          );
        }
      }
      // Either exact match or warned - skip injection
      return;
    }

    const parts: string[] = [];

    if (definition.syntax != null) {
      let syntax = String(definition.syntax).trim();
      if (!/^['"]/u.test(syntax)) syntax = `"${syntax}"`;
      parts.push(`syntax: ${syntax};`);
    }

    // inherits is required by the CSS @property spec - default to true
    const inherits = definition.inherits ?? true;
    parts.push(`inherits: ${inherits ? 'true' : 'false'};`);

    if (definition.initialValue != null) {
      let initialValueStr: string;
      if (typeof definition.initialValue === 'number') {
        initialValueStr = String(definition.initialValue);
      } else {
        // Process via tasty parser to resolve custom units/functions
        initialValueStr = parseStyle(definition.initialValue as any).output;
      }
      parts.push(`initial-value: ${initialValueStr};`);
    }

    const declarations = parts.join(' ').trim();

    const rule: StyleRule = {
      selector: `@property ${cssName}`,
      declarations,
    } as StyleRule;

    // Insert as a global rule; ignore returned info (no tracking/dispose)
    this.sheetManager.insertGlobalRule(
      registry,
      [rule],
      `property:${name}`,
      root,
    );

    // Track that this property was injected with its normalized definition
    registry.injectedProperties.set(cssName, normalizedDef);
  }

  /**
   * Check whether a given @property name was already injected by this injector.
   *
   * Accepts tasty token syntax:
   * - `$name` → checks `--name`
   * - `#name` → checks `--name-color`
   * - `--name` → checks `--name` (legacy format)
   */
  isPropertyDefined(
    name: string,
    options?: { root?: Document | ShadowRoot },
  ): boolean {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    // Parse the token to get the CSS property name
    const effectiveResult = getEffectiveDefinition(name, {});
    if (!effectiveResult.isValid) {
      return false;
    }

    return registry.injectedProperties.has(effectiveResult.cssName);
  }

  /**
   * Inject keyframes and return object with toString() and dispose()
   *
   * Keyframes are cached by content (steps). If the same content is injected
   * multiple times with different provided names, the first injected name is reused.
   *
   * If the same name is provided with different content (collision), a unique
   * name is generated to avoid overwriting the existing keyframes.
   */
  keyframes(
    steps: KeyframesSteps,
    nameOrOptions?: string | { root?: Document | ShadowRoot; name?: string },
  ): KeyframesResult {
    // Parse parameters
    const isStringName = typeof nameOrOptions === 'string';
    const providedName = isStringName ? nameOrOptions : nameOrOptions?.name;
    const root = isStringName ? document : nameOrOptions?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (Object.keys(steps).length === 0) {
      return {
        toString: () => '',
        dispose: () => {},
      };
    }

    // Generate content-based cache key (independent of provided name)
    const contentHash = JSON.stringify(steps);

    // Check if this exact content is already cached
    const existing = registry.keyframesCache.get(contentHash);
    if (existing) {
      existing.refCount++;
      return {
        toString: () => existing.name,
        dispose: () => this.disposeKeyframes(contentHash, registry),
      };
    }

    // Determine the actual name to use
    let actualName: string;

    if (providedName) {
      // Check if this name is already used with different content
      const existingContentForName =
        registry.keyframesNameToContent.get(providedName);

      if (existingContentForName && existingContentForName !== contentHash) {
        // Name collision: same name, different content
        // Generate a unique name to avoid overwriting
        actualName = `${providedName}-k${registry.keyframesCounter++}`;
      } else {
        // Name is available or used with same content
        actualName = providedName;
        // Track this name -> content mapping
        registry.keyframesNameToContent.set(providedName, contentHash);
      }
    } else {
      // No name provided, generate one
      actualName = `k${registry.keyframesCounter++}`;
    }

    // Insert keyframes
    const info = this.sheetManager.insertKeyframes(
      registry,
      steps,
      actualName,
      root,
    );
    if (!info) {
      return {
        toString: () => '',
        dispose: () => {},
      };
    }

    // Cache the result by content hash
    registry.keyframesCache.set(contentHash, {
      name: actualName,
      refCount: 1,
      info,
    });

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalInsertions++;
      registry.metrics.misses++;
    }

    return {
      toString: () => actualName,
      dispose: () => this.disposeKeyframes(contentHash, registry),
    };
  }

  /**
   * Dispose keyframes
   */
  private disposeKeyframes(contentHash: string, registry: any): void {
    const entry = registry.keyframesCache.get(contentHash);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      // Dispose immediately - keyframes are global and safe to clean up right away
      this.sheetManager.deleteKeyframes(registry, entry.info);
      registry.keyframesCache.delete(contentHash);

      // Clean up name-to-content mapping if this name was tracked
      // Find and remove the mapping for this content hash
      for (const [name, hash] of registry.keyframesNameToContent.entries()) {
        if (hash === contentHash) {
          registry.keyframesNameToContent.delete(name);
          break;
        }
      }

      // Update metrics
      if (registry.metrics) {
        registry.metrics.totalUnused++;
        registry.metrics.stylesCleanedUp++;
      }
    }
  }

  /**
   * Destroy all resources for a root
   */
  destroy(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    this.sheetManager.cleanup(targetRoot);
  }
}
