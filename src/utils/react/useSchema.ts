import { useSyncExternalStore } from 'react';

/**
 * The ambient viewing conditions — the color schema and the contrast tier the
 * document is showing right now.
 *
 * This module is the single owner of the definition: it builds the `@dark` /
 * `@hc` predefined states that `src/components/Root.tsx` registers with tasty,
 * *and* it answers the same question in JS. One definition, two readers, so the
 * CSS and the JS answers cannot drift apart.
 *
 * **For styling, do not use this.** `{ '': light, '@dark': dark, '@hc': hc }` is
 * the answer, and branching styles in JS gives up the conditionality that lets a
 * schema flip repaint without a re-render. Two cases the state map cannot serve:
 *
 * 1. **Surfaces the stylesheet does not reach** — a Vega spec, a CodeMirror or
 *    Monaco theme, a third-party iframe. They take values, not CSS, so `@dark`
 *    never applies and the branch has to happen in JS.
 * 2. **Control state that is not styling** — seeding or labelling a control from
 *    the ambient condition, e.g. a Light/Dark or Normal/High-contrast preview
 *    selector that starts on whatever the page is already showing.
 *
 * Root-level only, and deliberately not a generic state reader: tasty's state
 * vocabulary mixes element-local states (`hovered`, `pressed`, `disabled`) with
 * ambient ones (`@media(…)`, `@root(…)`), and only the ambient half is
 * answerable without an element. Evaluating the state language in JS would mean
 * a second implementation of the state algebra to keep in agreement with the CSS
 * one, for a question almost every caller asks about the root anyway.
 */

// ============================================================================
// The definition
// ============================================================================

/**
 * The `data-*` attribute names the opt-in uses, and the media queries it falls
 * back to. `@root(schema=dark)` compiles to `:root[data-schema="dark"]`, hence
 * the `data-` prefix on the DOM side and the bare key on the tasty side.
 */
const SCHEMA_KEY = 'schema';
const CONTRAST_KEY = 'contrast';
const SCHEMA_ATTR = `data-${SCHEMA_KEY}`;
const CONTRAST_ATTR = `data-${CONTRAST_KEY}`;
const DARK_QUERY = '(prefers-color-scheme: dark)';
const HIGH_CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * The `@dark` / `@hc` state aliases, in tasty's DSL — registered globally by
 * `<Root>` via `setGlobalPredefinedStates()`.
 *
 * The attribute opt-in wins over the system preference, and the fallback is
 * gated on the attribute being *absent* (`!@root(schema)`) rather than on it
 * being some other value — so `<html data-schema="light">` stays light inside a
 * dark OS, which is the whole point of an opt-in. {@link resolveSchema} and
 * {@link resolveHighContrast} read the same way.
 */
export const AMBIENT_PREDEFINED_STATES = {
  '@dark': `@root(${SCHEMA_KEY}=dark) | (!@root(${SCHEMA_KEY}) & @media${DARK_QUERY})`,
  '@hc': `@root(${CONTRAST_KEY}=high) | (!@root(${CONTRAST_KEY}) & @media${HIGH_CONTRAST_QUERY})`,
} as const;

/** The color schema the document resolves to — the two arms of the `@dark` state. */
export type ColorSchema = 'light' | 'dark';

// ============================================================================
// Reading
// ============================================================================

/**
 * `matchMedia` is called per read rather than cached, so a test that stubs it
 * takes effect immediately. Missing (older jsdom, non-DOM runtimes) reads as
 * "no preference", which lands on the light / normal-contrast defaults.
 */
function mediaMatches(query: string): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}

function rootAttribute(name: string): string | null {
  return typeof document === 'undefined'
    ? null
    : document.documentElement.getAttribute(name);
}

/**
 * The document's current color schema, read once — the JS answer to `@dark`.
 *
 * Outside React (a chart spec built in a module, an editor theme registered at
 * import time). In React use {@link useSchema}, which also re-renders on change.
 * Returns `'light'` with no DOM.
 */
export function resolveSchema(): ColorSchema {
  const attribute = rootAttribute(SCHEMA_ATTR);

  if (attribute !== null) {
    return attribute === 'dark' ? 'dark' : 'light';
  }

  return mediaMatches(DARK_QUERY) ? 'dark' : 'light';
}

/**
 * Whether the document is showing the high-contrast tier, read once — the JS
 * answer to `@hc`.
 *
 * Note this is an *ambient* condition, not the theme's `contrastLevel`: the
 * level is a `PaletteConfig` seed the app supplies (read it with
 * `getPaletteConfig()`), while this is the tier the viewer asked for.
 * Returns `false` with no DOM.
 */
export function resolveHighContrast(): boolean {
  const attribute = rootAttribute(CONTRAST_ATTR);

  if (attribute !== null) {
    return attribute === 'high';
  }

  return mediaMatches(HIGH_CONTRAST_QUERY);
}

// ============================================================================
// Watching
// ============================================================================

const listeners = new Set<() => void>();

let stopWatching: (() => void) | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Both inputs have to be watched, because either can decide the answer: the
 * attribute when the opt-in is set, the media query otherwise — an attribute flip
 * is invisible to `matchMedia` and a system flip is invisible to a
 * `MutationObserver`. One observer and one pair of query listeners are shared by
 * every subscriber, and torn down when the last one leaves.
 */
function startWatching(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const teardowns: (() => void)[] = [];

  // Guarded rather than assumed: jsdom ships neither `matchMedia` nor a
  // `MediaQueryList` in every version, and a consumer's unit tests are exactly
  // where a hook like this gets mounted. Losing one source of change is a stale
  // value; throwing is a broken render.
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    for (const query of [DARK_QUERY, HIGH_CONTRAST_QUERY]) {
      const list = window.matchMedia(query);

      if (typeof list?.addEventListener !== 'function') continue;

      list.addEventListener('change', notify);
      teardowns.push(() => list.removeEventListener('change', notify));
    }
  }

  if (typeof MutationObserver === 'function' && document.documentElement) {
    const observer = new MutationObserver(notify);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [SCHEMA_ATTR, CONTRAST_ATTR],
    });

    teardowns.push(() => observer.disconnect());
  }

  return () => teardowns.forEach((teardown) => teardown());
}

/**
 * Subscribe to ambient condition changes — either the schema or the contrast
 * tier. Returns an unsubscribe function.
 *
 * The listener takes no argument: re-read with {@link resolveSchema} /
 * {@link resolveHighContrast}, which is what the hooks below do. For non-React
 * consumers that own a surface the stylesheet cannot reach — re-theming a Monaco
 * instance, re-rendering a chart.
 */
export function subscribeSchema(listener: () => void): () => void {
  listeners.add(listener);

  if (!stopWatching) {
    stopWatching = startWatching();
  }

  return () => {
    listeners.delete(listener);

    if (!listeners.size && stopWatching) {
      stopWatching();
      stopWatching = null;
    }
  };
}

// ============================================================================
// React bindings
// ============================================================================

/**
 * Snapshots are primitives, so React bails out on an unchanged value and no
 * memoization is needed — a contrast change re-runs a `useSchema()` reader's
 * `getSnapshot` and stops there.
 */
const getServerSchema = (): ColorSchema => 'light';
const getServerHighContrast = () => false;

/**
 * The document's color schema, kept live — `'light'` or `'dark'`.
 *
 * ```tsx
 * const schema = useSchema();
 *
 * <VegaChart spec={useMemo(() => buildSpec(schema), [schema])} />;
 * ```
 *
 * Follows both the `<html data-schema>` opt-in and `prefers-color-scheme`,
 * exactly as the `@dark` state does. Under SSR it renders `'light'` and
 * re-renders with the real value after hydration.
 */
export function useSchema(): ColorSchema {
  return useSyncExternalStore(subscribeSchema, resolveSchema, getServerSchema);
}

/**
 * Whether the document is showing the high-contrast tier, kept live — the hook
 * form of {@link resolveHighContrast}, following `<html data-contrast>` and
 * `prefers-contrast` exactly as the `@hc` state does.
 *
 * Under SSR it renders `false` and re-renders with the real value after
 * hydration.
 */
export function useHighContrast(): boolean {
  return useSyncExternalStore(
    subscribeSchema,
    resolveHighContrast,
    getServerHighContrast,
  );
}
