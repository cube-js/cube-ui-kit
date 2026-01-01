import { useInsertionEffect, useMemo, useRef } from 'react';

import { injectGlobal } from '../injector';
import { renderStyles, StyleResult } from '../pipeline';
import { Styles } from '../styles/types';

/**
 * Hook to inject global styles for a given selector.
 * Useful for styling elements by selector without generating classNames.
 *
 * @param selector - CSS selector to apply styles to (e.g., '.my-class', ':root', 'body')
 * @param styles - Tasty styles object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useGlobalStyles('.card', {
 *     padding: '2x',
 *     radius: '1r',
 *     fill: '#white',
 *   });
 *
 *   return <div className="card">Content</div>;
 * }
 * ```
 */
export function useGlobalStyles(selector: string, styles?: Styles): void {
  const disposeRef = useRef<(() => void) | null>(null);

  // Render styles with the provided selector
  // Note: renderStyles overload with selector string returns StyleResult[] directly
  const styleResults = useMemo((): StyleResult[] => {
    if (!styles) return [];

    // Validate selector - empty string would cause renderStyles to return RenderResult instead of StyleResult[]
    if (!selector) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[Tasty] useGlobalStyles: selector is required and cannot be empty. ' +
            'Styles will not be injected.',
        );
      }
      return [];
    }

    const result = renderStyles(styles, selector);
    // When a non-empty selector is provided, renderStyles returns StyleResult[]
    return result as StyleResult[];
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
