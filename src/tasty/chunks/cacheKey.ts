/**
 * Chunk-specific cache key generation.
 *
 * Generates cache keys that only include styles relevant to a specific chunk,
 * enabling more granular caching and reuse.
 *
 * Enhanced to support predefined states:
 * - Global predefined states don't affect cache keys (constant across app)
 * - Local predefined states only affect cache keys if referenced in the chunk
 */

import {
  extractLocalPredefinedStates,
  extractPredefinedStateRefs,
} from '../states';
import { Styles } from '../styles/types';

/**
 * Recursively serialize a value with sorted keys for stable output.
 * This ensures that {a: 1, b: 2} and {b: 2, a: 1} produce the same string.
 */
function stableStringify(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  // Object: sort keys for stable order
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    if (obj[key] !== undefined) {
      parts.push(`${JSON.stringify(key)}:${stableStringify(obj[key])}`);
    }
  }
  return '{' + parts.join(',') + '}';
}

/**
 * Generate a cache key for a specific chunk.
 *
 * Only includes the styles that belong to this chunk, allowing
 * chunks to be cached independently.
 *
 * Also includes relevant local predefined states that are referenced
 * by this chunk's styles.
 *
 * @param styles - The full styles object
 * @param chunkName - Name of the chunk
 * @param styleKeys - Keys of styles belonging to this chunk
 * @returns A stable cache key string
 */
export function generateChunkCacheKey(
  styles: Styles,
  chunkName: string,
  styleKeys: string[],
): string {
  // Start with chunk name for namespace separation
  const parts: string[] = [chunkName];

  // Sort keys for stable ordering
  const sortedKeys = styleKeys.slice().sort();

  // Build the chunk-specific styles string for predefined state detection
  let chunkStylesStr = '';

  for (const key of sortedKeys) {
    const value = styles[key];
    if (value !== undefined) {
      // Use stable stringify for consistent serialization regardless of key order
      const serialized = stableStringify(value);
      parts.push(`${key}:${serialized}`);
      chunkStylesStr += serialized;
    }
  }

  // Extract local predefined states from the full styles object
  const localStates = extractLocalPredefinedStates(styles);

  // Only include local predefined states that are actually referenced in this chunk
  if (Object.keys(localStates).length > 0) {
    const referencedStates = extractPredefinedStateRefs(chunkStylesStr);
    const relevantLocalStates: string[] = [];

    for (const stateName of referencedStates) {
      if (localStates[stateName]) {
        relevantLocalStates.push(`${stateName}=${localStates[stateName]}`);
      }
    }

    // Add relevant local states to the cache key (sorted for stability)
    if (relevantLocalStates.length > 0) {
      relevantLocalStates.sort();
      parts.unshift(`[states:${relevantLocalStates.join('|')}]`);
    }
  }

  // Use null character as separator (safe, not in JSON output)
  return parts.join('\0');
}
