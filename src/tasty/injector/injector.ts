/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { Component, createElement } from 'react';

import { StyleResult } from '../utils/renderStyles';
import { parseStyle } from '../utils/styles';

// Simple CSS text to StyleResult converter for injectGlobal backward compatibility
import { SheetManager } from './sheet-manager';
import {
  GlobalInjectResult,
  InjectResult,
  KeyframesResult,
  KeyframesSteps,
  StyleInjectorConfig,
  StyleRule,
} from './types';

import type { ComponentType } from 'react';

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
        // Simple concatenation: .className (double specificity) + selectorSuffix
        newSelector = `.${className}.${className}${newSelector}`;
      }

      return {
        ...rule,
        selector: newSelector,
        needsClassName: undefined, // Remove the flag after processing
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
        if (info) this.sheetManager.deleteRule(registry, info);
      },
    };
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
    this.sheetManager['performBulkCleanup'](registry);
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
   * Define a CSS @property custom property
   * Example:
   * @property --rotation { syntax: "<angle>"; inherits: false; initial-value: 45deg; }
   * Note: No caching or dispose — this defines a global property.
   */
  property(
    name: string,
    options?: {
      syntax?: string;
      inherits?: boolean;
      initialValue?: string | number;
      root?: Document | ShadowRoot;
    },
  ): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    // Check if already defined to avoid duplicates
    if (registry.injectedProperties.has(name)) {
      return;
    }

    const parts: string[] = [];

    if (options?.syntax != null) {
      let syntax = String(options.syntax).trim();
      if (!/^['"]/u.test(syntax)) syntax = `"${syntax}"`;
      parts.push(`syntax: ${syntax};`);
    }

    if (options?.inherits != null) {
      parts.push(`inherits: ${options.inherits ? 'true' : 'false'};`);
    }

    if (options?.initialValue != null) {
      let initialValueStr: string;
      if (typeof options.initialValue === 'number') {
        initialValueStr = String(options.initialValue);
      } else {
        // Process via tasty parser to resolve custom units/functions
        initialValueStr = parseStyle(options.initialValue as any).output;
      }
      parts.push(`initial-value: ${initialValueStr};`);
    }

    const declarations = parts.join(' ').trim();

    const rule: StyleRule = {
      selector: `@property ${name}`,
      declarations,
    } as StyleRule;

    // Insert as a global rule; ignore returned info (no tracking/dispose)
    this.sheetManager.insertGlobalRule(
      registry,
      [rule],
      `property:${name}`,
      root,
    );

    // Track that this property was injected
    registry.injectedProperties.add(name);
  }

  /**
   * Check whether a given @property name was already injected by this injector
   */
  isPropertyDefined(
    name: string,
    options?: { root?: Document | ShadowRoot },
  ): boolean {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    return registry.injectedProperties.has(name);
  }

  /**
   * Inject keyframes and return object with toString() and dispose()
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

    // Generate cache key from steps and name
    const cacheKey = providedName
      ? `${providedName}:${JSON.stringify(steps)}`
      : JSON.stringify(steps);

    // Check if already cached
    const existing = registry.keyframesCache.get(cacheKey);
    if (existing) {
      existing.refCount++;
      return {
        toString: () => existing.name,
        dispose: () => this.disposeKeyframes(cacheKey, registry),
      };
    }

    // Use provided name or generate new one
    const name = providedName || `k${registry.keyframesCounter++}`;

    // Insert keyframes
    const info = this.sheetManager.insertKeyframes(registry, steps, name, root);
    if (!info) {
      return {
        toString: () => '',
        dispose: () => {},
      };
    }

    // Cache the result
    registry.keyframesCache.set(cacheKey, {
      name,
      refCount: 1,
      info,
    });

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalInsertions++;
      registry.metrics.misses++;
    }

    return {
      toString: () => name,
      dispose: () => this.disposeKeyframes(cacheKey, registry),
    };
  }

  /**
   * Dispose keyframes
   */
  private disposeKeyframes(cacheKey: string, registry: any): void {
    const entry = registry.keyframesCache.get(cacheKey);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      // Dispose immediately - keyframes are global and safe to clean up right away
      this.sheetManager.deleteKeyframes(registry, entry.info);
      registry.keyframesCache.delete(cacheKey);

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

  /**
   * Create a global style component like styled-components createGlobalStyle
   * Returns a React component that injects global styles when mounted and cleans up when unmounted
   */
  createGlobalStyle<Props = {}>(
    strings: TemplateStringsArray,
    ...interpolations: Array<
      string | number | ((props: Props) => string | number)
    >
  ): ComponentType<Props & { root?: Document | ShadowRoot }> {
    const injector = this; // Capture the injector instance

    class GlobalStyleComponent extends Component<
      Props & { root?: Document | ShadowRoot }
    > {
      private disposeFunction: (() => void) | null = null;

      componentDidMount() {
        this.injectStyles();
      }

      componentDidUpdate() {
        this.disposeStyles();
        this.injectStyles();
      }

      componentWillUnmount() {
        this.disposeStyles();
      }

      private injectStyles = () => {
        const css = this.interpolateTemplate();
        if (css.trim()) {
          const styleResults = this.parseCSSToStyleResults(css);
          // Bind the global inject method to the outer injector instance
          const result = injector.injectGlobal(styleResults as any, {
            root: this.props.root,
          });
          this.disposeFunction = result.dispose;
        }
      };

      private disposeStyles = () => {
        if (this.disposeFunction) {
          this.disposeFunction();
          this.disposeFunction = null;
        }
      };

      private interpolateTemplate = (): string => {
        let result = strings[0];

        for (let i = 0; i < interpolations.length; i++) {
          const interpolation = interpolations[i];
          const value =
            typeof interpolation === 'function'
              ? interpolation(this.props as Props)
              : interpolation;
          result += String(value) + strings[i + 1];
        }

        return result;
      };

      private parseCSSToStyleResults = (css: string): StyleResult[] => {
        const rules: StyleResult[] = [];

        // Enhanced CSS parser for global styles that handles nested rules
        this.parseCSS(css, rules, [], '');

        return rules;
      };

      private parseCSS = (
        css: string,
        rules: StyleResult[],
        atRuleStack: string[],
        parentSelector = '',
      ) => {
        // Remove both CSS and JavaScript-style comments
        let cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, ''); // CSS comments
        cleanCSS = cleanCSS.replace(/\/\/.*$/gm, ''); // JavaScript-style comments

        let i = 0;
        while (i < cleanCSS.length) {
          // Skip whitespace
          while (i < cleanCSS.length && /\s/.test(cleanCSS[i])) {
            i++;
          }

          if (i >= cleanCSS.length) break;

          // Find the next selector or at-rule
          let selectorStart = i;
          let braceDepth = 0;
          let inString = false;
          let stringChar = '';

          // Find the opening brace
          while (i < cleanCSS.length) {
            const char = cleanCSS[i];

            if (inString) {
              if (char === stringChar && cleanCSS[i - 1] !== '\\') {
                inString = false;
              }
            } else {
              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
              } else if (char === '{') {
                braceDepth++;
                if (braceDepth === 1) {
                  break; // Found the opening brace
                }
              } else if (char === '}') {
                braceDepth--;
              }
            }
            i++;
          }

          if (i >= cleanCSS.length) break;

          const selectorPart = cleanCSS.substring(selectorStart, i).trim();
          i++; // Skip the opening brace

          // Find the matching closing brace
          const contentStart = i;
          braceDepth = 1;
          inString = false;

          while (i < cleanCSS.length && braceDepth > 0) {
            const char = cleanCSS[i];

            if (inString) {
              if (char === stringChar && cleanCSS[i - 1] !== '\\') {
                inString = false;
              }
            } else {
              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
              } else if (char === '{') {
                braceDepth++;
              } else if (char === '}') {
                braceDepth--;
              }
            }
            i++;
          }

          const content = cleanCSS.substring(contentStart, i - 1).trim();

          // Check if this is an at-rule
          if (selectorPart.startsWith('@')) {
            const atSelector = selectorPart.trim();
            // Leaf at-rules that contain declarations directly and should be emitted as-is
            const leafAtRules = [
              '@font-face',
              '@property',
              '@page',
              '@counter-style',
              '@font-feature-values',
              '@font-palette-values',
              '@color-profile',
            ];

            const isLeafAtRule = leafAtRules.some((prefix) =>
              atSelector.startsWith(prefix),
            );

            if (isLeafAtRule) {
              // Emit the at-rule with its declarations directly
              if (content.trim()) {
                rules.push({
                  selector: atSelector,
                  declarations: content,
                  atRules:
                    atRuleStack.length > 0 ? [...atRuleStack] : undefined,
                });
              }
            } else {
              // Wrapper at-rule (e.g., @media, @supports, @keyframes) — parse its content
              const newAtRuleStack = [...atRuleStack, atSelector];
              this.parseCSS(content, rules, newAtRuleStack, parentSelector);
            }
          } else {
            // Check if content contains nested rules (has { and })
            if (content.includes('{') && content.includes('}')) {
              // This selector has nested rules, parse them
              const { declarations, nestedCSS } =
                this.separateDeclarationsAndNested(content);

              // Process the selector (handle & syntax)
              const processedSelector = this.processSelector(
                selectorPart,
                parentSelector,
              );

              // Add declarations if any
              if (declarations.trim()) {
                rules.push({
                  selector: processedSelector,
                  declarations: declarations.trim(),
                  atRules:
                    atRuleStack.length > 0 ? [...atRuleStack] : undefined,
                });
              }

              // Parse nested CSS with current selector as parent
              if (nestedCSS.trim()) {
                this.parseCSS(nestedCSS, rules, atRuleStack, processedSelector);
              }
            } else {
              // This is a regular selector with only declarations
              const processedSelector = this.processSelector(
                selectorPart,
                parentSelector,
              );
              if (content && processedSelector) {
                rules.push({
                  selector: processedSelector,
                  declarations: content,
                  atRules:
                    atRuleStack.length > 0 ? [...atRuleStack] : undefined,
                });
              }
            }
          }
        }
      };

      private separateDeclarationsAndNested = (
        content: string,
      ): { declarations: string; nestedCSS: string } => {
        const declarations: string[] = [];
        const nestedRules: string[] = [];

        let i = 0;
        let currentDeclaration = '';

        while (i < content.length) {
          const char = content[i];

          if (char === '{') {
            // Found start of nested rule, find the selector before it
            let selectorStart = currentDeclaration.lastIndexOf(';') + 1;
            if (selectorStart === 0 && currentDeclaration.trim()) {
              // No semicolon found, this might be the first rule
              selectorStart = 0;
            }

            const beforeBrace = currentDeclaration.substring(0, selectorStart);
            const selector = currentDeclaration.substring(selectorStart).trim();

            if (beforeBrace.trim()) {
              declarations.push(beforeBrace.trim());
            }

            // Find the matching closing brace
            let braceDepth = 1;
            let ruleStart = i + 1;
            i++; // Skip opening brace

            while (i < content.length && braceDepth > 0) {
              if (content[i] === '{') braceDepth++;
              else if (content[i] === '}') braceDepth--;
              i++;
            }

            const ruleContent = content.substring(ruleStart, i - 1);
            nestedRules.push(`${selector} { ${ruleContent} }`);
            currentDeclaration = '';
          } else {
            currentDeclaration += char;
            i++;
          }
        }

        // Add remaining declarations
        if (currentDeclaration.trim()) {
          declarations.push(currentDeclaration.trim());
        }

        return {
          declarations: declarations.join(' '),
          nestedCSS: nestedRules.join('\n'),
        };
      };

      private processSelector = (
        selector: string,
        parentSelector: string,
      ): string => {
        if (!parentSelector) {
          return selector;
        }

        // Handle & syntax - replace & with parent selector
        if (selector.includes('&')) {
          return selector.replace(/&/g, parentSelector);
        }

        // If no &, treat as descendant selector
        return `${parentSelector} ${selector}`;
      };

      render() {
        return null;
      }
    }

    return GlobalStyleComponent as ComponentType<
      Props & { root?: Document | ShadowRoot }
    >;
  }
}
