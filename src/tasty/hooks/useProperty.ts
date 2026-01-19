import { useInsertionEffect, useMemo } from 'react';

import { getGlobalInjector } from '../config';

export interface UsePropertyOptions {
  /**
   * CSS syntax string for the property (e.g., '<color>', '<length>', '<angle>').
   * For color tokens (#name), this is auto-set to '<color>' and cannot be overridden.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@property/syntax
   */
  syntax?: string;
  /**
   * Whether the property inherits from parent elements
   * @default true
   */
  inherits?: boolean;
  /**
   * Initial value for the property.
   * For color tokens (#name), this defaults to 'transparent' if not specified.
   */
  initialValue?: string | number;
  /**
   * Shadow root or document to inject into
   */
  root?: Document | ShadowRoot;
}

/**
 * Hook to register a CSS @property custom property.
 * This enables advanced features like animating custom properties.
 *
 * Note: @property rules are global and persistent once defined.
 * The hook ensures the property is only registered once per root.
 *
 * Accepts tasty token syntax for the property name:
 * - `$name` → defines `--name`
 * - `#name` → defines `--name-color` (auto-sets syntax: '<color>', defaults initialValue: 'transparent')
 * - `--name` → defines `--name` (legacy format)
 *
 * @param name - The property token ($name, #name) or CSS property name (--name)
 * @param options - Property configuration
 *
 * @example Basic property with token syntax
 * ```tsx
 * function Spinner() {
 *   useProperty('$rotation', {
 *     syntax: '<angle>',
 *     inherits: false,
 *     initialValue: '0deg',
 *   });
 *
 *   return <div className="spinner" />;
 * }
 * ```
 *
 * @example Color property with token syntax (auto-sets syntax)
 * ```tsx
 * function MyComponent() {
 *   useProperty('#theme', {
 *     initialValue: 'red', // syntax: '<color>' is auto-set
 *   });
 *
 *   // Now --theme-color can be animated with CSS transitions
 *   return <div style={{ '--theme-color': 'blue' } as React.CSSProperties}>Colored</div>;
 * }
 * ```
 *
 * @example Legacy format (still supported)
 * ```tsx
 * function ResizableBox() {
 *   useProperty('--box-size', {
 *     syntax: '<length>',
 *     initialValue: '100px',
 *   });
 *
 *   return <div style={{ width: 'var(--box-size)' }} />;
 * }
 * ```
 */
export function useProperty(name: string, options?: UsePropertyOptions): void {
  // Memoize the options to create a stable dependency
  const optionsKey = useMemo(() => {
    if (!options) return '';
    return JSON.stringify({
      syntax: options.syntax,
      inherits: options.inherits,
      initialValue: options.initialValue,
    });
  }, [options?.syntax, options?.inherits, options?.initialValue]);

  useInsertionEffect(() => {
    if (!name) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Tasty] useProperty: property name is required`);
      }
      return;
    }

    const injector = getGlobalInjector();

    // Check if already defined (properties are persistent)
    // The injector handles token parsing internally
    if (injector.isPropertyDefined(name, { root: options?.root })) {
      return;
    }

    // Register the property
    // The injector handles $name, #name, --name parsing and auto-sets
    // syntax for color tokens
    injector.property(name, {
      syntax: options?.syntax,
      inherits: options?.inherits,
      initialValue: options?.initialValue,
      root: options?.root,
    });

    // No cleanup - @property rules are global and persistent
    // Re-registering is a no-op anyway due to the isPropertyDefined check
  }, [name, optionsKey, options?.root]);
}
