import { useInsertionEffect, useMemo, useRef } from 'react';

import { injectRawCSS } from '../injector';

type UseRawCSSOptions = { root?: Document | ShadowRoot };

/**
 * Hook to inject raw CSS text directly without parsing.
 * This is a low-overhead alternative for injecting global CSS that doesn't need tasty processing.
 *
 * The CSS is inserted into a separate style element (data-tasty-raw) to avoid conflicts
 * with tasty's chunked style sheets.
 *
 * @example Static CSS string
 * ```tsx
 * function GlobalStyles() {
 *   useRawCSS(`
 *     body {
 *       margin: 0;
 *       padding: 0;
 *       font-family: sans-serif;
 *     }
 *   `);
 *
 *   return null;
 * }
 * ```
 *
 * @example Factory function with dependencies (like useMemo)
 * ```tsx
 * function ThemeStyles({ theme }: { theme: 'light' | 'dark' }) {
 *   useRawCSS(() => `
 *     :root {
 *       --bg-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
 *       --text-color: ${theme === 'dark' ? '#ffffff' : '#1a1a1a'};
 *     }
 *   `, [theme]);
 *
 *   return null;
 * }
 * ```
 *
 * @example With options
 * ```tsx
 * function ShadowStyles({ shadowRoot }) {
 *   useRawCSS(() => `.scoped { color: red; }`, [], { root: shadowRoot });
 *   return null;
 * }
 * ```
 */

// Overload 1: Static CSS string
export function useRawCSS(css: string, options?: UseRawCSSOptions): void;

// Overload 2: Factory function with dependencies
export function useRawCSS(
  factory: () => string,
  deps: readonly unknown[],
  options?: UseRawCSSOptions,
): void;

// Implementation
export function useRawCSS(
  cssOrFactory: string | (() => string),
  depsOrOptions?: readonly unknown[] | UseRawCSSOptions,
  options?: UseRawCSSOptions,
): void {
  // Detect which overload is being used
  const isFactory = typeof cssOrFactory === 'function';

  // Parse arguments based on overload
  const deps =
    isFactory && Array.isArray(depsOrOptions) ? depsOrOptions : undefined;
  const opts = isFactory
    ? options
    : (depsOrOptions as UseRawCSSOptions | undefined);

  // Memoize CSS - for factory functions, use provided deps; for strings, use the string itself
  const css = useMemo(
    () =>
      isFactory ? (cssOrFactory as () => string)() : (cssOrFactory as string),

    isFactory ? deps ?? [] : [cssOrFactory],
  );

  const disposeRef = useRef<(() => void) | null>(null);

  useInsertionEffect(() => {
    // Dispose previous injection if any
    disposeRef.current?.();

    if (!css.trim()) {
      disposeRef.current = null;
      return;
    }

    // Inject new CSS
    const { dispose } = injectRawCSS(css, opts);
    disposeRef.current = dispose;

    // Cleanup on unmount or when css changes
    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [css, opts?.root]);
}
