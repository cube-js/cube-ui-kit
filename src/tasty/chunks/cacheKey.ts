/**
 * Chunk-specific cache key generation.
 *
 * Generates cache keys that only include styles relevant to a specific chunk,
 * enabling more granular caching and reuse.
 */

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

  for (const key of sortedKeys) {
    const value = styles[key];
    if (value !== undefined) {
      // Use stable stringify for consistent serialization regardless of key order
      parts.push(`${key}:${stableStringify(value)}`);
    }
  }

  // Use null character as separator (safe, not in JSON output)
  return parts.join('\0');
}
