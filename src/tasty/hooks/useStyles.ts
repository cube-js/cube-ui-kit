import { useInsertionEffect, useMemo, useRef } from 'react';

import {
  categorizeStyleKeys,
  CHUNK_NAMES,
  generateChunkCacheKey,
  renderStylesForChunk,
} from '../chunks';
import { allocateClassName, inject } from '../injector';
import { Styles } from '../styles/types';
import { RenderResult } from '../utils/renderStyles';
import { stringifyStyles } from '../utils/styles';

export interface UseStylesOptions {
  /**
   * Tasty styles object to generate CSS classes for
   */
  styles?: Styles;
}

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
 *     styles: {
 *       padding: '2x',
 *       fill: '#purple',
 *       radius: '1r',
 *     }
 *   });
 *
 *   return <div className={className}>Styled content</div>;
 * }
 * ```
 */
export function useStyles({ styles }: UseStylesOptions): UseStylesResult {
  // Array of dispose functions for each chunk
  const disposeRef = useRef<(() => void)[]>([]);

  // Memoize the style key for change detection
  const styleKey = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      return '';
    }
    return stringifyStyles(styles);
  }, [styles]);

  // Process chunks: categorize, generate cache keys, render, and allocate classNames
  const processedChunks: ProcessedChunk[] = useMemo(() => {
    if (!styleKey || !styles) {
      return [];
    }

    // Categorize style keys into chunks
    const chunkMap = categorizeStyleKeys(styles as Record<string, unknown>);
    const chunks: ProcessedChunk[] = [];

    for (const [chunkName, styleKeys] of chunkMap) {
      // Skip empty chunks
      if (styleKeys.length === 0) {
        continue;
      }

      // Generate cache key for this chunk
      const cacheKey = generateChunkCacheKey(styles, chunkName, styleKeys);

      // Render styles for this chunk
      const renderResult = renderStylesForChunk(styles, chunkName, styleKeys);

      // Skip chunks with no rules
      if (renderResult.rules.length === 0) {
        continue;
      }

      // Allocate className for this chunk (safe in render phase)
      const { className } = allocateClassName(cacheKey);

      chunks.push({
        name: chunkName,
        styleKeys,
        cacheKey,
        renderResult,
        className,
      });
    }

    return chunks;
  }, [styleKey, styles]);

  // Inject styles in insertion effect (avoids render phase side effects)
  useInsertionEffect(() => {
    // Cleanup all previous chunk disposals
    disposeRef.current.forEach((dispose) => dispose?.());
    disposeRef.current = [];

    // Inject each chunk and collect dispose functions
    for (const chunk of processedChunks) {
      if (chunk.renderResult.rules.length > 0) {
        const { dispose } = inject(chunk.renderResult.rules, {
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
