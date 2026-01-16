import type { StyleDetails, UnitHandler } from '../parser/types';
import type { StyleHandlerDefinition } from '../utils/styles';

/**
 * A tasty plugin that extends the style system with custom functions, units, states, or handlers.
 */
export interface TastyPlugin {
  /** Unique name for the plugin (used for debugging and conflict detection) */
  name: string;
  /** Custom functions that transform parsed style groups into CSS values */
  funcs?: Record<string, (groups: StyleDetails[]) => string>;
  /** Custom units that transform numeric values (e.g., `2x` → `calc(2 * var(--gap))`) */
  units?: Record<string, string | UnitHandler>;
  /** Custom state aliases (e.g., `'@mobile': '@media(w < 768px)'`) */
  states?: Record<string, string>;
  /**
   * Custom style handlers that transform style properties into CSS declarations.
   * Handlers replace built-in handlers for the same style name.
   * @example
   * ```ts
   * handlers: {
   *   // Simple handler - lookup style inferred from key
   *   fill: ({ fill }) => fill ? { 'background-color': fill } : undefined,
   *   // Multi-property handler
   *   spacing: [['gap', 'padding'], ({ gap, padding }) => ({ ... })],
   * }
   * ```
   */
  handlers?: Record<string, StyleHandlerDefinition>;
  /** Predefined tokens replaced during style parsing (`$name` or `#name`) */
  tokens?: {
    [key: `$${string}` | `#${string}`]: string | number;
  };
}

/**
 * A factory function that creates a TastyPlugin.
 * Can optionally accept configuration options.
 *
 * @example
 * ```ts
 * // Plugin without options
 * const okhslPlugin: TastyPluginFactory = () => ({
 *   name: 'okhsl',
 *   funcs: { okhsl: okhslFunc },
 * });
 *
 * // Plugin with options
 * const debugPlugin: TastyPluginFactory<{ verbose: boolean }> = (options) => ({
 *   name: 'debug',
 *   funcs: { debug: createDebugFunc(options.verbose) },
 * });
 * ```
 */
export type TastyPluginFactory<TOptions = void> = TOptions extends void
  ? () => TastyPlugin
  : (options: TOptions) => TastyPlugin;
