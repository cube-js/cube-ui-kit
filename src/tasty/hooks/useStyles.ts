import { useInsertionEffect, useMemo, useRef } from 'react';

import {
  categorizeStyleKeys,
  CHUNK_NAMES,
  generateChunkCacheKey,
  renderStylesForChunk,
} from '../chunks';
import { getGlobalKeyframes, hasGlobalKeyframes } from '../config';
import { allocateClassName, inject, keyframes, property } from '../injector';
import { KeyframesSteps, PropertyDefinition } from '../injector/types';
import {
  extractAnimationNamesFromStyles,
  extractLocalKeyframes,
  filterUsedKeyframes,
  hasLocalKeyframes,
  mergeKeyframes,
  replaceAnimationNames,
} from '../keyframes';
import { RenderResult } from '../pipeline';
import { extractLocalProperties, hasLocalProperties } from '../properties';
import { Styles } from '../styles/types';
import { resolveRecipes } from '../utils/resolve-recipes';
import { stringifyStyles } from '../utils/styles';

/**
 * Check if styles contain @starting-style rules.
 *
 * @starting-style CSS cannot be applied via multiple class names because
 * of cascade - later rules override earlier ones. When @starting is detected,
 * we combine top-level styles into a single chunk but keep sub-element styles
 * in their own chunk for better caching.
 */
function containsStartingStyle(styleKey: string): boolean {
  return styleKey.includes('@starting');
}

/**
 * Tasty styles object to generate CSS classes for.
 * Can be undefined or empty object for no styles.
 */
export type UseStylesOptions = Styles | undefined;

export interface UseStylesResult {
  /**
   * Generated className(s) to apply to the element.
   * Can be empty string if no styles are provided.
   * With chunking enabled, may contain multiple space-separated class names.
   */
  className: string;
}

/**
 * Information about a processed chunk
 */
interface ProcessedChunk {
  name: string;
  styleKeys: string[];
  cacheKey: string;
  renderResult: RenderResult;
  className: string;
}

/**
 * Render, cache-key, and allocate a className for a single chunk.
 * Returns a ProcessedChunk, or null if the chunk produces no CSS rules.
 */
function processChunk(
  styles: Styles,
  chunkName: string,
  styleKeys: string[],
): ProcessedChunk | null {
  if (styleKeys.length === 0) return null;

  const renderResult = renderStylesForChunk(styles, chunkName, styleKeys);
  if (renderResult.rules.length === 0) return null;

  const cacheKey = generateChunkCacheKey(styles, chunkName, styleKeys);
  const { className } = allocateClassName(cacheKey);

  return { name: chunkName, styleKeys, cacheKey, renderResult, className };
}

/**
 * Merge chunk map entries for @starting-style partial chunking.
 *
 * All non-subcomponent chunks are merged into a single COMBINED entry,
 * while SUBCOMPONENTS stays separate. This preserves CSS cascade for
 * @starting-style while still allowing sub-element styles to cache independently.
 */
function mergeChunksForStartingStyle(
  chunkMap: Map<string, string[]>,
): Map<string, string[]> {
  const merged = new Map<string, string[]>();
  const combinedKeys: string[] = [];

  for (const [chunkName, keys] of chunkMap) {
    if (chunkName === CHUNK_NAMES.SUBCOMPONENTS) {
      merged.set(CHUNK_NAMES.SUBCOMPONENTS, keys);
    } else {
      combinedKeys.push(...keys);
    }
  }

  if (combinedKeys.length > 0) {
    // Insert COMBINED first so it appears before SUBCOMPONENTS
    const result = new Map<string, string[]>();
    result.set(CHUNK_NAMES.COMBINED, combinedKeys);
    for (const [k, v] of merged) {
      result.set(k, v);
    }
    return result;
  }

  return merged;
}

/**
 * Get keyframes that are actually used in styles.
 * Returns null if no keyframes are used (fast path for zero overhead).
 *
 * Optimization order:
 * 1. Check if any keyframes are defined (local or global) - if not, return null
 * 2. Extract animation names from styles - if none, return null
 * 3. Merge and filter keyframes to only used ones
 */
function getUsedKeyframes(
  styles: Styles,
): Record<string, KeyframesSteps> | null {
  // Fast path: no keyframes defined anywhere
  const hasLocal = hasLocalKeyframes(styles);
  const hasGlobal = hasGlobalKeyframes();
  if (!hasLocal && !hasGlobal) return null;

  // Extract animation names from styles (not from rendered CSS - faster)
  const usedNames = extractAnimationNamesFromStyles(styles);
  if (usedNames.size === 0) return null;

  // Merge local and global keyframes
  const local = hasLocal ? extractLocalKeyframes(styles) : null;
  const global = hasGlobal ? getGlobalKeyframes() : null;
  const allKeyframes = mergeKeyframes(local, global);

  // Filter to only used keyframes
  return filterUsedKeyframes(allKeyframes, usedNames);
}

/**
 * Hook to generate CSS classes from Tasty styles.
 * Handles style rendering, className allocation, and CSS injection.
 *
 * Uses chunking to split styles into logical groups for better caching
 * and CSS reuse across components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { className } = useStyles({
 *     padding: '2x',
 *     fill: '#purple',
 *     radius: '1r',
 *   });
 *
 *   return <div className={className}>Styled content</div>;
 * }
 * ```
 */
export function useStyles(styles: UseStylesOptions): UseStylesResult {
  // Array of dispose functions for each chunk
  const disposeRef = useRef<(() => void)[]>([]);

  // Store styles by their stringified key to avoid recomputing when only reference changes
  const stylesRef = useRef<{ key: string; styles: Styles | undefined }>({
    key: '',
    styles: undefined,
  });

  // Resolve recipes before any processing (zero overhead if no recipes configured)
  const resolvedStyles = useMemo(() => {
    if (!styles) return styles;
    return resolveRecipes(styles);
  }, [styles]);

  // Compute style key - this is a primitive string that captures style content
  const styleKey = useMemo(() => {
    if (!resolvedStyles || Object.keys(resolvedStyles).length === 0) {
      return '';
    }
    return stringifyStyles(resolvedStyles);
  }, [resolvedStyles]);

  // Update ref when styleKey changes (content actually changed)
  if (stylesRef.current.key !== styleKey) {
    stylesRef.current = { key: styleKey, styles: resolvedStyles };
  }

  // Process chunks: categorize, generate cache keys, render, and allocate classNames
  // Only depends on styleKey (primitive), not styles object reference
  const processedChunks: ProcessedChunk[] = useMemo(() => {
    const currentStyles = stylesRef.current.styles;
    if (!styleKey || !currentStyles) {
      return [];
    }

    // Categorize style keys into chunks
    let chunkMap = categorizeStyleKeys(
      currentStyles as Record<string, unknown>,
    );

    // Partial chunking for styles containing @starting-style rules.
    // @starting-style CSS cannot work with multiple class names due to cascade,
    // so we merge all top-level chunks into one but keep sub-element styles separate.
    if (containsStartingStyle(styleKey)) {
      chunkMap = mergeChunksForStartingStyle(chunkMap);
    }

    // Process each chunk: render → cache key → allocate className
    const chunks: ProcessedChunk[] = [];

    for (const [chunkName, chunkStyleKeys] of chunkMap) {
      const chunk = processChunk(currentStyles, chunkName, chunkStyleKeys);
      if (chunk) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }, [styleKey]);

  // Inject styles in insertion effect (avoids render phase side effects)
  useInsertionEffect(() => {
    // Cleanup all previous disposals
    disposeRef.current.forEach((dispose) => dispose?.());
    disposeRef.current = [];

    // Fast path: no chunks to inject
    if (processedChunks.length === 0) {
      return;
    }

    const currentStyles = stylesRef.current.styles;

    // Get keyframes that are actually used (returns null if none - zero overhead)
    const usedKeyframes = currentStyles
      ? getUsedKeyframes(currentStyles)
      : null;

    // Inject keyframes and build name map (only if we have keyframes)
    let nameMap: Map<string, string> | null = null;

    if (usedKeyframes) {
      nameMap = new Map();
      for (const [name, steps] of Object.entries(usedKeyframes)) {
        const result = keyframes(steps, { name });
        const injectedName = result.toString();
        // Only add to map if name differs (optimization for replacement check)
        if (injectedName !== name) {
          nameMap.set(name, injectedName);
        }
        disposeRef.current.push(result.dispose);
      }
      // Clear map if no replacements needed
      if (nameMap.size === 0) {
        nameMap = null;
      }
    }

    // Register local @properties if defined (no dispose needed - properties are permanent)
    // Token formats: $name → --name, #name → --name-color (with auto syntax: '<color>')
    // The injector.property() handles token parsing and auto-settings internally
    // Note: Global properties are injected once when styles are first generated (see markStylesGenerated)
    if (currentStyles && hasLocalProperties(currentStyles)) {
      const localProperties = extractLocalProperties(currentStyles);
      if (localProperties) {
        for (const [token, definition] of Object.entries(localProperties)) {
          // Pass the token directly - injector handles parsing
          property(token, definition);
        }
      }
    }

    // Inject each chunk
    for (const chunk of processedChunks) {
      if (chunk.renderResult.rules.length > 0) {
        // Replace animation names only if needed
        const rulesToInject = nameMap
          ? chunk.renderResult.rules.map((rule) => ({
              ...rule,
              declarations: replaceAnimationNames(rule.declarations, nameMap!),
            }))
          : chunk.renderResult.rules;

        const { dispose } = inject(rulesToInject, {
          cacheKey: chunk.cacheKey,
        });
        disposeRef.current.push(dispose);
      }
    }

    return () => {
      disposeRef.current.forEach((dispose) => dispose?.());
      disposeRef.current = [];
    };
  }, [processedChunks]);

  // Combine all chunk classNames
  const className = useMemo(() => {
    return processedChunks.map((chunk) => chunk.className).join(' ');
  }, [processedChunks]);

  return {
    className,
  };
}
