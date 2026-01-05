/**
 * Tasty Plugins
 *
 * This module exports official tasty plugins that extend the style system.
 *
 * @example
 * ```ts
 * import { configure } from '@cube-dev/ui-kit';
 * import { okhslPlugin } from '@cube-dev/ui-kit/tasty/plugins';
 *
 * configure({
 *   plugins: [okhslPlugin()],
 * });
 * ```
 */

// Types
export type { TastyPlugin, TastyPluginFactory } from './types';

// Plugins
export { okhslPlugin, okhslFunc } from './okhsl-plugin';
