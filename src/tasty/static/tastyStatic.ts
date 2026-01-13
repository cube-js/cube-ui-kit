import { Styles } from '../styles/types';
import { mergeStyles } from '../utils/mergeStyles';

import { createStaticStyle, isStaticStyle, StaticStyle } from './types';

/**
 * Generate styles and return a StaticStyle object.
 * The object has `className`, `styles`, and `toString()`.
 *
 * @example
 * ```typescript
 * const button = tastyStatic({
 *   fill: '#blue',
 *   padding: '2x',
 * });
 * // After build: { className: 'ts3f2a1b', styles: {...}, toString() }
 *
 * <div className={button} />  // Works via toString()
 * ```
 */
export function tastyStatic(styles: Styles): StaticStyle;

/**
 * Extend an existing StaticStyle with additional styles.
 * Uses mergeStyles() internally for proper nested selector handling.
 *
 * @example
 * ```typescript
 * const button = tastyStatic({ fill: '#blue' });
 * const primary = tastyStatic(button, { fill: '#purple' });
 * // After build: { className: 'ts8c4d2e', styles: {...merged...}, toString() }
 * ```
 */
export function tastyStatic(base: StaticStyle, styles: Styles): StaticStyle;

/**
 * Generate styles for a specific CSS selector.
 * The call is completely removed after build transformation.
 *
 * @example
 * ```typescript
 * tastyStatic('.heading', { preset: 'h1', color: '#primary' });
 * // After build: (removed)
 * ```
 */
export function tastyStatic(selector: string, styles: Styles): void;

/**
 * Build-time only function for zero-runtime static site generation.
 *
 * This function is transformed by the Babel plugin:
 * - `tastyStatic(styles)` → StaticStyle object with className
 * - `tastyStatic(base, styles)` → StaticStyle object with merged styles
 * - `tastyStatic(selector, styles)` → removed entirely
 *
 * At runtime (during development/build), this function returns a placeholder.
 * In production, all calls are replaced/removed by the build plugin.
 */
export function tastyStatic(
  stylesOrBaseOrSelector: Styles | StaticStyle | string,
  styles?: Styles,
): StaticStyle | void {
  // This code only executes if the Babel plugin hasn't processed the file yet.
  // In a properly configured build, this function is never called at runtime.

  if (typeof stylesOrBaseOrSelector === 'string') {
    // Selector mode: tastyStatic(selector, styles)
    // The plugin will remove this call entirely
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[tasty] tastyStatic('${stylesOrBaseOrSelector}', styles) was called at runtime. ` +
          'This indicates the Babel plugin is not configured. ' +
          'Add @cube-dev/ui-kit/tasty/zero/babel to your Babel config.',
      );
    }
    return; // void
  }

  if (isStaticStyle(stylesOrBaseOrSelector)) {
    // Extension mode: tastyStatic(base, styles)
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[tasty] tastyStatic(base, styles) was called at runtime. ' +
          'This indicates the Babel plugin is not configured. ' +
          'Add @cube-dev/ui-kit/tasty/zero/babel to your Babel config.',
      );
    }
    // Merge styles for dev mode preview (won't have real classNames)
    const mergedStyles = mergeStyles(
      stylesOrBaseOrSelector.styles,
      styles || {},
    );
    return createStaticStyle('__TASTY_STATIC_NOT_TRANSFORMED__', mergedStyles);
  }

  // Styles mode: tastyStatic(styles)
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[tasty] tastyStatic(styles) was called at runtime. ' +
        'This indicates the Babel plugin is not configured. ' +
        'Add @cube-dev/ui-kit/tasty/zero/babel to your Babel config.',
    );
  }

  // Return placeholder - styles won't be applied without the plugin
  return createStaticStyle(
    '__TASTY_STATIC_NOT_TRANSFORMED__',
    stylesOrBaseOrSelector,
  );
}
