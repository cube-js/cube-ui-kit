/**
 * Build-time only module for zero-runtime static site generation.
 *
 * Usage:
 * ```typescript
 * import { tastyStatic } from '@cube-dev/ui-kit/tasty/static';
 *
 * // Returns StaticStyle object (className + styles + toString)
 * const button = tastyStatic({
 *   fill: '#blue',
 *   padding: '2x',
 * });
 *
 * // Extend existing styles
 * const primaryButton = tastyStatic(button, {
 *   fill: '#purple',
 * });
 *
 * // Global styles (removed at build time)
 * tastyStatic('.heading', { preset: 'h1' });
 *
 * // Usage in JSX
 * <div className={button} />           // toString() coercion
 * <div className={button.className} /> // Explicit
 * ```
 *
 * Requires the Babel plugin to be configured:
 * ```javascript
 * // babel.config.js
 * plugins: [
 *   ['@cube-dev/ui-kit/tasty/zero/babel', { output: 'public/tasty.css' }]
 * ]
 * ```
 */

export { tastyStatic } from './tastyStatic';
export { createStaticStyle, isStaticStyle } from './types';
export type { StaticStyle } from './types';
export type { Styles } from '../styles/types';

// Re-export mergeStyles for advanced use cases
export { mergeStyles } from '../utils/mergeStyles';
