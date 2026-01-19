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
import { RenderResult, renderStyles } from '../pipeline';
import { extractLocalProperties, hasLocalProperties } from '../properties';
import { Styles } from '../styles/types';
import { stringifyStyles } from '../utils/styles';

/**
 * Check if styles contain @starting-style rules.
 *
 * @starting-style CSS cannot be applied via multiple class names because
 * of cascade - later rules override earlier ones. When @starting is detected,
 * we disable chunking and use a single class name for all styles.
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

  // Compute style key - this is a primitive string that captures style content
  const styleKey = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      return '';
    }
    return stringifyStyles(styles);
  }, [styles]);

  // Update ref when styleKey changes (content actually changed)
  if (stylesRef.current.key !== styleKey) {
    stylesRef.current = { key: styleKey, styles };
  }

  // Process chunks: categorize, generate cache keys, render, and allocate classNames
  // Only depends on styleKey (primitive), not styles object reference
  const processedChunks: ProcessedChunk[] = useMemo(() => {
    const currentStyles = stylesRef.current.styles;
    if (!styleKey || !currentStyles) {
      return [];
    }

    // Disable chunking for styles containing @starting-style rules.
    // @starting-style CSS cannot work with multiple class names due to cascade -
    // the rules would override each other instead of combining properly.
    if (containsStartingStyle(styleKey)) {
      const renderResult = renderStyles(currentStyles);

      if (renderResult.rules.length === 0) {
        return [];
      }

      const { className } = allocateClassName(styleKey);

      return [
        {
          name: CHUNK_NAMES.COMBINED,
          styleKeys: Object.keys(currentStyles),
          cacheKey: styleKey,
          renderResult,
          className,
        },
      ];
    }

    // Categorize style keys into chunks
    const chunkMap = categorizeStyleKeys(
      currentStyles as Record<string, unknown>,
    );
    const chunks: ProcessedChunk[] = [];

    for (const [chunkName, chunkStyleKeys] of chunkMap) {
      // Skip empty chunks
      if (chunkStyleKeys.length === 0) {
        continue;
      }

      // Generate cache key for this chunk
      const cacheKey = generateChunkCacheKey(
        currentStyles,
        chunkName,
        chunkStyleKeys,
      );

      // Render styles for this chunk
      const renderResult = renderStylesForChunk(
        currentStyles,
        chunkName,
        chunkStyleKeys,
      );

      // Skip chunks with no rules
      if (renderResult.rules.length === 0) {
        continue;
      }

      // Allocate className for this chunk (safe in render phase)
      const { className } = allocateClassName(cacheKey);

      chunks.push({
        name: chunkName,
        styleKeys: chunkStyleKeys,
        cacheKey,
        renderResult,
        className,
      });
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
