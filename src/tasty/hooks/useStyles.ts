import { useInsertionEffect, useMemo, useRef } from 'react';

import {
  categorizeStyleKeys,
  CHUNK_NAMES,
  generateChunkCacheKey,
  renderStylesForChunk,
} from '../chunks';
import { allocateClassName, inject } from '../injector';
import { RenderResult, renderStyles } from '../pipeline';
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
