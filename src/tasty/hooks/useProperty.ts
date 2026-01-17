import { useInsertionEffect, useMemo } from 'react';

import { getGlobalInjector } from '../config';

export interface UsePropertyOptions {
  /**
   * CSS syntax string for the property (e.g., '<color>', '<length>', '<angle>')
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@property/syntax
   */
  syntax?: string;
  /**
   * Whether the property inherits from parent elements
   * @default true
   */
  inherits?: boolean;
  /**
   * Initial value for the property
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
 * @param name - The custom property name (must start with --)
 * @param options - Property configuration
 *
 * @example Basic color property
 * ```tsx
 * function MyComponent() {
 *   useProperty('--my-color', {
 *     syntax: '<color>',
 *     initialValue: 'red',
 *   });
 *
 *   // Now --my-color can be animated with CSS transitions
 *   return <div style={{ '--my-color': 'blue' } as React.CSSProperties}>Colored</div>;
 * }
 * ```
 *
 * @example Angle property for rotations
 * ```tsx
 * function Spinner() {
 *   useProperty('--rotation', {
 *     syntax: '<angle>',
 *     inherits: false,
 *     initialValue: '0deg',
 *   });
 *
 *   return <div className="spinner" />;
 * }
 * ```
 *
 * @example Length property
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
    if (!name || !name.startsWith('--')) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[Tasty] useProperty: property name must start with "--". Got: "${name}"`,
        );
      }
      return;
    }

    const injector = getGlobalInjector();

    // Check if already defined (properties are persistent)
    if (injector.isPropertyDefined(name, { root: options?.root })) {
      return;
    }

    // Register the property
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
