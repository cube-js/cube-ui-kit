import { createHash } from 'crypto';

import {
  categorizeStyleKeys,
  generateChunkCacheKey,
  renderStylesForChunk,
} from '../chunks';
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
          // If part is empty, just use base selector
          if (!part) return baseSelector;
          // If part starts with a pseudo-class or pseudo-element, append to base
          if (part.startsWith(':') || part.startsWith('[')) {
            return `${baseSelector}${part}`;
          }
          // If part starts with >, +, ~ combinator, append with space
          if (
            part.startsWith('>') ||
            part.startsWith('+') ||
            part.startsWith('~')
          ) {
            return `${baseSelector}${part}`;
          }
          // Otherwise, combine base with part
          return `${baseSelector}${part}`;
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
      let css = `${rule.selector} { ${rule.declarations} }`;

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
