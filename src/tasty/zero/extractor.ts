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
  const rules = renderStyles(styles, selector);
  const css = formatRulesToCSS(rules, selector);

  return { selector, css };
}

/**
 * Format StyleResult[] to CSS string
 */
function formatRulesToCSS(rules: StyleResult[], _baseSelector: string): string {
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
