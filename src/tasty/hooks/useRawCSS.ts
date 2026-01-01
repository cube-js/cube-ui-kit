import { useInsertionEffect, useRef } from 'react';

import { injectRawCSS } from '../injector';

/**
 * Hook to inject raw CSS text directly without parsing.
 * This is a low-overhead alternative for injecting global CSS that doesn't need tasty processing.
 *
 * The CSS is inserted into a separate style element (data-tasty-raw) to avoid conflicts
 * with tasty's chunked style sheets.
 *
 * @param css - Raw CSS text to inject
 * @param options - Optional configuration
 * @param options.root - Document or ShadowRoot to inject styles into (defaults to document)
 *
 * @example
 * ```tsx
 * function GlobalStyles() {
 *   useRawCSS(`
 *     body {
 *       margin: 0;
 *       padding: 0;
 *       font-family: sans-serif;
 *     }
 *
 *     .notification {
 *       position: fixed;
 *       top: 16px;
 *       right: 16px;
 *     }
 *   `);
 *
 *   return null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With dynamic CSS
 * function ThemeStyles({ theme }: { theme: 'light' | 'dark' }) {
 *   const css = useMemo(() => `
 *     :root {
 *       --bg-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
 *       --text-color: ${theme === 'dark' ? '#ffffff' : '#1a1a1a'};
 *     }
 *   `, [theme]);
 *
 *   useRawCSS(css);
 *
 *   return null;
 * }
 * ```
 */
export function useRawCSS(
  css: string,
  options?: { root?: Document | ShadowRoot },
): void {
  const disposeRef = useRef<(() => void) | null>(null);

  useInsertionEffect(() => {
    // Dispose previous injection if any
    disposeRef.current?.();

    if (!css.trim()) {
      disposeRef.current = null;
      return;
    }

    // Inject new CSS
    const { dispose } = injectRawCSS(css, options);
    disposeRef.current = dispose;

    // Cleanup on unmount or when css changes
    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [css, options?.root]);
}
