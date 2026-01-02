import { Styles } from '../styles/types';

/**
 * Static style definition returned by tastyStatic().
 *
 * Supports both explicit className access and implicit string coercion via toString().
 *
 * @example
 * ```typescript
 * const button = tastyStatic({ fill: '#blue' });
 *
 * // Both work in JSX:
 * <div className={button} />           // Uses toString()
 * <div className={button.className} /> // Explicit
 *
 * // Extension:
 * const primary = tastyStatic(button, { fill: '#purple' });
 * ```
 */
export interface StaticStyle {
  /**
   * Generated className(s) for use in JSX.
   * May contain multiple space-separated class names due to chunking.
   */
  className: string;

  /**
   * The original (or merged) styles object.
   * Available for extension via tastyStatic(base, overrides).
   */
  styles: Styles;

  /**
   * Returns className for implicit string coercion.
   * Enables `<div className={button} />` syntax.
   */
  toString(): string;
}

/**
 * Create a StaticStyle object.
 * Used internally by the Babel plugin to generate output.
 */
export function createStaticStyle(
  className: string,
  styles: Styles,
): StaticStyle {
  return {
    className,
    styles,
    toString() {
      return this.className;
    },
  };
}

/**
 * Type guard to check if a value is a StaticStyle object.
 */
export function isStaticStyle(value: unknown): value is StaticStyle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'className' in value &&
    'styles' in value &&
    'toString' in value &&
    typeof (value as StaticStyle).className === 'string' &&
    typeof (value as StaticStyle).styles === 'object'
  );
}
