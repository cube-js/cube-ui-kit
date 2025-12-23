import { useInsertionEffect, useMemo, useRef } from 'react';

import { allocateClassName, inject } from '../injector';
import { Styles } from '../styles/types';
import { RenderResult, renderStyles } from '../utils/renderStyles';
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
   */
  className: string;
}

/**
 * Generate unique cache key for style deduplication.
 * Uses null character as separator for better performance and no collision risk.
 */
function generateStyleCacheKey(styleKey: string, contextKey?: string): string {
  return contextKey ? `${styleKey}\0${contextKey}` : styleKey;
}

/**
 * Hook to generate CSS classes from Tasty styles.
 * Handles style rendering, className allocation, and CSS injection.
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
  const disposeRef = useRef<(() => void) | null>(null);

  // Memoize the style key for cache lookups
  const styleKey = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      return '';
    }
    return stringifyStyles(styles);
  }, [styles]);

  // Generate cache key
  const cacheKey = useMemo(() => {
    if (!styleKey) return '';
    return generateStyleCacheKey(styleKey);
  }, [styleKey]);

  // Render styles to CSS rules
  const renderResult: RenderResult = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      return { rules: [], className: '' };
    }
    return renderStyles(styles);
  }, [styles, styleKey]);

  // Allocate className in render phase (safe for React Strict Mode)
  const allocatedClassName = useMemo(() => {
    if (!renderResult.rules.length || !cacheKey) return '';
    const { className } = allocateClassName(cacheKey);
    return className;
  }, [renderResult.rules.length, cacheKey]);

  // Inject styles in insertion effect (avoids render phase side effects)
  useInsertionEffect(() => {
    // Cleanup previous disposal reference
    disposeRef.current?.();

    if (renderResult.rules.length > 0 && cacheKey) {
      const injectionResult = inject(renderResult.rules, { cacheKey });
      disposeRef.current = injectionResult.dispose;
    } else {
      disposeRef.current = null;
    }

    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [renderResult.rules, cacheKey]);

  return {
    className: allocatedClassName,
  };
}
