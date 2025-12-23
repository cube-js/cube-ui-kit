import { useInsertionEffect, useMemo, useRef } from 'react';

import { injectGlobal } from '../injector';
import { Styles } from '../styles/types';
import { renderStyles } from '../utils/renderStyles';

import type { StyleResult } from '../utils/renderStyles';

export interface UseGlobalStylesOptions {
  /**
   * CSS selector to apply styles to (e.g., '.my-class', ':root', 'body')
   */
  selector: string;
  /**
   * Tasty styles object
   */
  styles?: Styles;
}

/**
 * Hook to inject global styles for a given selector.
 * Useful for styling elements by selector without generating classNames.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useGlobalStyles({
 *     selector: '.card',
 *     styles: {
 *       padding: '2x',
 *       radius: '1r',
 *       fill: '#white',
 *     }
 *   });
 *
 *   return <div className="card">Content</div>;
 * }
 * ```
 */
export function useGlobalStyles({
  selector,
  styles,
}: UseGlobalStylesOptions): void {
  const disposeRef = useRef<(() => void) | null>(null);

  // Render styles with the provided selector
  // Note: renderStyles overload with selector string returns StyleResult[] directly
  const styleResults = useMemo((): StyleResult[] => {
    if (!styles) return [];
    const result = renderStyles(styles, selector);
    // When a selector is provided, renderStyles returns StyleResult[]
    return result as unknown as StyleResult[];
  }, [styles, selector]);

  // Inject as global styles
  useInsertionEffect(() => {
    disposeRef.current?.();

    if (styleResults.length > 0) {
      const { dispose } = injectGlobal(styleResults);
      disposeRef.current = dispose;
    } else {
      disposeRef.current = null;
    }

    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [styleResults]);
}
