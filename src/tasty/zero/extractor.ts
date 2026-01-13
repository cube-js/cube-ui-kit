import { createHash } from 'crypto';

import {
  categorizeStyleKeys,
  generateChunkCacheKey,
  renderStylesForChunk,
} from '../chunks';
import { KeyframesSteps } from '../injector/types';
import {
  extractAnimationNamesFromStyles,
  extractLocalKeyframes,
  filterUsedKeyframes,
  hasLocalKeyframes,
  mergeKeyframes,
} from '../keyframes';
import { renderStyles, StyleResult } from '../pipeline';
import { Styles } from '../styles/types';

export interface ExtractedChunk {
  className: string;
  css: string;
}

export interface ExtractedSelector {
  selector: string;
  css: string;
}

export interface ExtractedKeyframes {
  name: string;
  css: string;
}

export interface KeyframesExtractionResult {
  /** Keyframes to inject (deduplicated by content) */
  keyframes: ExtractedKeyframes[];
  /** Map from original animation name to canonical name (for replacement) */
  nameMap: Map<string, string>;
}

/**
 * Generate a deterministic className from a cache key using content hash.
 * This ensures the same styles always produce the same className,
 * regardless of build order or incremental compilation.
 */
function generateClassName(cacheKey: string): string {
  const hash = createHash('md5').update(cacheKey).digest('hex').slice(0, 6);
  return `ts${hash}`; // 'ts' prefix for "tasty-static" to distinguish from runtime 't' classes
}

/**
 * Extract styles using chunking (for className mode).
 * Returns multiple classes, one per chunk.
 */
export function extractStylesWithChunks(styles: Styles): ExtractedChunk[] {
  const chunks: ExtractedChunk[] = [];

  // Categorize style keys into chunks
  const chunkMap = categorizeStyleKeys(styles as Record<string, unknown>);

  for (const [chunkName, chunkStyleKeys] of chunkMap) {
    if (chunkStyleKeys.length === 0) continue;

    // Generate cache key for this chunk (used for className hash)
    const cacheKey = generateChunkCacheKey(styles, chunkName, chunkStyleKeys);

    // Render styles for this chunk
    const renderResult = renderStylesForChunk(
      styles,
      chunkName,
      chunkStyleKeys,
    );

    if (renderResult.rules.length === 0) continue;

    // Generate deterministic className from content hash
    const className = generateClassName(cacheKey);
    const selector = `.${className}.${className}`;

    // Format CSS
    const css = formatRulesToCSS(renderResult.rules, selector);

    chunks.push({ className, css });
  }

  return chunks;
}

/**
 * Extract styles for a specific selector (for global/selector mode).
 * Returns a single CSS block.
 */
export function extractStylesForSelector(
  selector: string,
  styles: Styles,
): ExtractedSelector {
  // renderStyles with selector returns StyleResult[] with selectors already applied
  const rules = renderStyles(styles, selector);
  // Format without re-prefixing - rules already have the full selector
  const css = formatRulesDirectly(rules);

  return { selector, css };
}

/**
 * Format StyleResult[] to CSS string.
 * Prefixes each rule's selector with the base selector.
 * Used for chunked styles where rules have relative selectors.
 */
function formatRulesToCSS(rules: StyleResult[], baseSelector: string): string {
  return rules
    .map((rule) => {
      // Handle selector as array (OR conditions) or string
      // Note: renderStyles without className joins array selectors with '|||' placeholder
      const selectorParts = Array.isArray(rule.selector)
        ? rule.selector
        : rule.selector
          ? rule.selector.split('|||')
          : [''];

      // Prefix each selector part with the base selector
      const fullSelector = selectorParts
        .map((part) => {
          // Build selector: [rootPrefix] baseSelector[part]
          let selector: string;

          // If part is empty, just use base selector
          if (!part) {
            selector = baseSelector;
          } else if (part.startsWith(':') || part.startsWith('[')) {
            // If part starts with a pseudo-class or pseudo-element, append to base
            selector = `${baseSelector}${part}`;
          } else if (
            part.startsWith('>') ||
            part.startsWith('+') ||
            part.startsWith('~')
          ) {
            // If part starts with >, +, ~ combinator, append with space
            selector = `${baseSelector}${part}`;
          } else {
            // Otherwise, combine base with part
            selector = `${baseSelector}${part}`;
          }

          // Prepend rootPrefix if present (for @root() states)
          if (rule.rootPrefix) {
            selector = `${rule.rootPrefix} ${selector}`;
          }

          return selector;
        })
        .join(', ');

      let css = `${fullSelector} { ${rule.declarations} }`;

      // Wrap in at-rules (in reverse order for proper nesting)
      if (rule.atRules && rule.atRules.length > 0) {
        for (const atRule of [...rule.atRules].reverse()) {
          css = `${atRule} {\n  ${css}\n}`;
        }
      }

      return css;
    })
    .join('\n\n');
}

/**
 * Format StyleResult[] to CSS string directly without prefixing.
 * Used for global styles where rules already have the full selector.
 */
function formatRulesDirectly(rules: StyleResult[]): string {
  return rules
    .map((rule) => {
      // Prepend rootPrefix if present (for @root() states)
      const selector = rule.rootPrefix
        ? `${rule.rootPrefix} ${rule.selector}`
        : rule.selector;

      let css = `${selector} { ${rule.declarations} }`;

      // Wrap in at-rules (in reverse order for proper nesting)
      if (rule.atRules && rule.atRules.length > 0) {
        for (const atRule of [...rule.atRules].reverse()) {
          css = `${atRule} {\n  ${css}\n}`;
        }
      }

      return css;
    })
    .join('\n\n');
}

// Note: With hash-based className generation, counter management functions
// are no longer needed. ClassNames are deterministic based on content.

/**
 * Generate a deterministic keyframes name from content hash.
 * This ensures the same keyframes content always produces the same name,
 * enabling automatic deduplication across elements and files.
 */
function generateKeyframesName(steps: KeyframesSteps): string {
  const content = JSON.stringify(steps);
  const hash = createHash('md5').update(content).digest('hex').slice(0, 6);
  return `kf${hash}`; // 'kf' prefix for "keyframes"
}

/**
 * Extract keyframes that are used in styles.
 * Merges local @keyframes with global keyframes, filters to only used ones.
 * Generates hash-based names from content for automatic deduplication.
 *
 * @param styles - The styles object (may contain @keyframes and animation properties)
 * @param globalKeyframes - Optional global keyframes from config
 * @returns Keyframes to inject and name mapping for replacement
 */
export function extractKeyframesFromStyles(
  styles: Styles,
  globalKeyframes?: Record<string, KeyframesSteps> | null,
): KeyframesExtractionResult {
  const emptyResult: KeyframesExtractionResult = {
    keyframes: [],
    nameMap: new Map(),
  };

  // Extract animation names from styles
  const usedNames = extractAnimationNamesFromStyles(styles);
  if (usedNames.size === 0) return emptyResult;

  // Merge local and global keyframes
  const local = hasLocalKeyframes(styles)
    ? extractLocalKeyframes(styles)
    : null;
  const allKeyframes = mergeKeyframes(local, globalKeyframes ?? null);

  // Filter to only used keyframes
  const usedKeyframes = filterUsedKeyframes(allKeyframes, usedNames);
  if (!usedKeyframes) return emptyResult;

  // Generate hash-based names and collect unique keyframes
  const seenHashes = new Set<string>();
  const nameMap = new Map<string, string>();
  const keyframesToEmit: ExtractedKeyframes[] = [];

  for (const [originalName, steps] of Object.entries(usedKeyframes)) {
    const hashedName = generateKeyframesName(steps);

    // Always map original name to hashed name (for CSS replacement)
    nameMap.set(originalName, hashedName);

    // Only emit each unique keyframe once
    if (!seenHashes.has(hashedName)) {
      seenHashes.add(hashedName);
      const css = keyframesToCSS(hashedName, steps);
      keyframesToEmit.push({ name: hashedName, css });
    }
  }

  return { keyframes: keyframesToEmit, nameMap };
}

/**
 * Convert keyframes steps to CSS string.
 */
function keyframesToCSS(name: string, steps: KeyframesSteps): string {
  const stepRules: string[] = [];

  for (const [key, value] of Object.entries(steps)) {
    if (typeof value === 'string') {
      // Raw CSS string
      stepRules.push(`${key} { ${value.trim()} }`);
    } else if (value && typeof value === 'object') {
      // Style map - convert to CSS declarations
      const declarations = Object.entries(value)
        .map(([prop, val]) => {
          const cssProperty = camelToKebab(prop);
          return `${cssProperty}: ${val}`;
        })
        .join('; ');
      stepRules.push(`${key} { ${declarations} }`);
    }
  }

  return `@keyframes ${name} { ${stepRules.join(' ')} }`;
}

/**
 * Convert camelCase to kebab-case.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
