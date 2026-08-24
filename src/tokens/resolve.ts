import { useState, useSyncExternalStore } from 'react';

import { useLayoutEffect } from '../utils/react/useLayoutEffect';
import { warn } from '../utils/warnings';

import { getTokens } from './all-tokens';
import { getPaletteVersion, usePaletteVersion } from './palette-config';

/**
 * Resolving a design token to a literal value, for consumers that render into a
 * surface our stylesheets do not reach — a third-party iframe (Stripe Elements),
 * a CodeMirror / Monaco theme object, a Vega spec. Those take colors, lengths and
 * font descriptors as values; `var(--purple-color)` means nothing to them.
 *
 * There are two ways to get this wrong by hand, and both fail silently:
 *
 * 1. **Reading from the wrong element.** `<Root>` declares the token block on
 *    `<body>` (see `src/components/GlobalStyles.tsx`), so `<html>` — and any
 *    detached node — is outside it.
 * 2. **Trusting what comes back.** Tasty registers an `@property` rule for every
 *    custom property it can infer a type for, which means an *undeclared* token
 *    does not read back as `''`. It reads back as that rule's `initial-value`:
 *    `rgba(0, 0, 0, 0)` for `<color>`, `0px` for `<length>`, `0deg`, `0s`, `0`.
 *    A placeholder is a plausible-looking value, so it propagates into an
 *    invisible chart series or a zero-height font instead of throwing.
 *
 * The helpers below read from the declaration site by default and return `null`
 * (or an explicit `fallback`) rather than a placeholder.
 */

/**
 * The `initial-value`s tasty auto-registers, whitespace-stripped for comparison.
 * A token that reads back as one of these is almost always undeclared where it
 * was read — `resolve.browser.test.tsx` is what keeps this set honest against
 * the tasty version we ship with.
 */
const PLACEHOLDER_VALUES = new Set([
  'transparent',
  'rgba(0,0,0,0)',
  '0',
  '0px',
  '0deg',
  '0s',
]);

/** Custom property names are CSS identifiers: a letter or `_`, then word chars or `-`. */
const PROPERTY_NAME_RE = /^[a-zA-Z_][\w-]*$/;

export interface ResolveTokenOptions {
  /**
   * Element to read the tokens off. Defaults to the document `<body>`, which is
   * where `<Root>` declares them.
   *
   * Pass an element when the value has to reflect a *local* override — a subtree
   * carrying its own `tokens` prop (`renderColorTokens()`), or one under a
   * `data-schema` / `data-contrast` attribute that differs from the document's.
   * The element's own document and view are used, so a node inside a same-origin
   * iframe resolves against that iframe.
   */
  element?: Element | null;
  /**
   * Returned in place of `null` when a token is unset, unresolvable, or reads
   * back as an `@property` placeholder — including on the server, where there is
   * no DOM to read.
   */
  fallback?: string;
}

/**
 * Fields mirror {@link TypographyPreset}. A field the preset does not define is
 * `null`, except `fontFamily`, which falls back to the document's `--font-sans`
 * so the common case (`t1`–`t4`, `h1`–`h6`, which inherit the sans stack rather
 * than naming it) still hands back a usable stack.
 */
export type ResolvedPreset = {
  fontFamily: string | null;
  fontSize: string | null;
  fontStyle: string | null;
  fontWeight: string | null;
  lineHeight: string | null;
  letterSpacing: string | null;
  textTransform: string | null;
  boldFontWeight: string | null;
  iconSize: string | null;
};

const PRESET_FIELD_SUFFIXES: Record<keyof ResolvedPreset, string> = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontStyle: 'font-style',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textTransform: 'text-transform',
  boldFontWeight: 'bold-font-weight',
  iconSize: 'icon-size',
};

const PRESET_FIELDS = Object.keys(
  PRESET_FIELD_SUFFIXES,
) as (keyof ResolvedPreset)[];

/**
 * Map a token to its CSS custom property name, using the same convention tasty's
 * style DSL does: `#name` is a color (`--name-color`), `$name` is everything else
 * (`--name`). A raw `--name` or a bare `name` is taken as written.
 *
 * Returns `null` for anything that would not be a valid custom property.
 */
function tokenToProperty(token: string): string | null {
  const trimmed = token.trim();

  let name: string;

  if (trimmed.startsWith('--')) {
    name = trimmed.slice(2);
  } else if (trimmed.startsWith('#')) {
    name = `${trimmed.slice(1)}-color`;
  } else if (trimmed.startsWith('$')) {
    name = trimmed.slice(1);
  } else {
    name = trimmed;
  }

  return PROPERTY_NAME_RE.test(name) ? `--${name}` : null;
}

/** Whitespace and case are not meaningful in the values we compare against. */
function normalizeValue(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

/**
 * Tokens whose *declared* value is itself placeholder-shaped, keyed by custom
 * property name — `--clear-color` is `transparent` on purpose, `--sharp-radius`
 * is `0px` on purpose, and every `--*-letter-spacing` that reads `0` is a real
 * `0`. Without this the guard below would report them as unset.
 *
 * Memoized against the palette version, like {@link getTokens} itself.
 */
let literalsCache: { version: number; names: Set<string> } | null = null;

function getPlaceholderShapedTokens(): Set<string> {
  const version = getPaletteVersion();

  if (!literalsCache || literalsCache.version !== version) {
    const names = new Set<string>();

    for (const [key, value] of Object.entries(getTokens())) {
      // Glaze color tokens are per-scheme state maps, not literals — they never
      // declare a placeholder, so only strings are worth indexing.
      if (typeof value !== 'string') continue;
      if (!PLACEHOLDER_VALUES.has(normalizeValue(value))) continue;

      const name = tokenToProperty(key);

      if (name) names.add(name);
    }

    literalsCache = { version, names };
  }

  return literalsCache.names;
}

/** These fire per token, per page — once each, not once per render. */
const warnedTokens = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warnedTokens.has(key)) return;

  warnedTokens.add(key);

  warn(message);
}

/** The document `<body>` is where `<Root>` declares the token block. */
function resolveTarget(element?: Element | null): Element | null {
  if (element) return element;
  if (typeof document === 'undefined') return null;

  return document.body ?? document.documentElement ?? null;
}

function readValue(
  computed: CSSStyleDeclaration,
  token: string,
  fallback: string | null,
  silent: boolean,
): string | null {
  const name = tokenToProperty(token);

  if (!name) {
    warnOnce(`name:${token}`, `"${token}" is not a valid design token name.`);

    return fallback;
  }

  const value = computed.getPropertyValue(name).trim();

  if (!value) return fallback;

  if (
    PLACEHOLDER_VALUES.has(normalizeValue(value)) &&
    !getPlaceholderShapedTokens().has(name)
  ) {
    if (!silent) {
      warnOnce(
        `placeholder:${name}`,
        `Token "${token}" (${name}) read back as an @property placeholder, meaning it is not declared on the element it was read from. <Root> declares tokens on <body>, so <html>, a detached node, and a tree that has not mounted <Root> yet all return placeholders. Pass \`element\` to read from a specific subtree, or \`fallback\` for a value to use instead.`,
      );
    }

    return fallback;
  }

  return value;
}

/**
 * Read the resolved value of one design token — a color, a length, a font
 * descriptor — as a literal string.
 *
 * ```ts
 * resolveTokenValue('#purple'); // 'oklch(0.52 0.24 285)'
 * resolveTokenValue('$space-md'); // '8px'
 * resolveTokenValue('$t3-font-size'); // '14px'
 * ```
 *
 * Returns `options.fallback ?? null` when the token is not declared on the
 * element it was read from — see {@link ResolveTokenOptions}.
 */
export function resolveTokenValue(
  token: string,
  options: ResolveTokenOptions = {},
): string | null {
  return resolveTokenValues([token], options)[token];
}

/**
 * {@link resolveTokenValue} for several tokens at once, through a single
 * `getComputedStyle` call. Prefer this when building a theme object — a Stripe
 * `Appearance`, a CodeMirror theme — which needs a dozen values at a time.
 *
 * ```ts
 * const { '#surface': background, '#surface-text': color } = resolveTokenValues([
 *   '#surface',
 *   '#surface-text',
 * ]);
 * ```
 */
export function resolveTokenValues<T extends string>(
  tokens: readonly T[],
  options: ResolveTokenOptions = {},
): Record<T, string | null> {
  return readTokens(tokens, options, false);
}

/** Shared by the public reader and the preset reader, which suppresses warnings. */
function readTokens<T extends string>(
  tokens: readonly T[],
  options: ResolveTokenOptions,
  silent: boolean,
): Record<T, string | null> {
  const { element, fallback = null } = options;
  const result = {} as Record<T, string | null>;
  const target = resolveTarget(element);
  const view = target?.ownerDocument?.defaultView;

  if (!target || !view) {
    for (const token of tokens) result[token] = fallback;

    return result;
  }

  const computed = view.getComputedStyle(target);

  for (const token of tokens) {
    result[token] = readValue(computed, token, fallback, silent);
  }

  return result;
}

/**
 * Resolve a typography preset — `'t3'`, `'h2'`, `'s3'` — to the literal font
 * descriptors behind it, for a surface that takes a font as values rather than
 * as a `preset` style.
 *
 * ```ts
 * const { fontFamily, fontSize, lineHeight } = resolvePresetValues('t3');
 * ```
 *
 * A preset legitimately leaves most of these unset — only headings carry an
 * `iconSize`, only the `s*` family names a `fontFamily` — so unlike
 * {@link resolveTokenValues} a miss here is expected and never warns.
 */
export function resolvePresetValues(
  preset: string,
  options: ResolveTokenOptions = {},
): ResolvedPreset {
  const { fallback = null } = options;
  const names = PRESET_FIELDS.map(
    (field) => `$${preset}-${PRESET_FIELD_SUFFIXES[field]}`,
  );
  const values = readTokens(
    [...names, '--font-sans'],
    { element: options.element },
    true,
  );
  const resolved = {} as ResolvedPreset;

  PRESET_FIELDS.forEach((field, index) => {
    resolved[field] = values[names[index]] ?? fallback;
  });

  // Every preset but the `s*` family inherits the sans stack rather than naming
  // it, so the token is absent by design and `--font-sans` is the real answer.
  resolved.fontFamily =
    values[names[PRESET_FIELDS.indexOf('fontFamily')]] ??
    values['--font-sans'] ??
    fallback;

  return resolved;
}

// ============================================================================
// Appearance subscription
// ============================================================================

/**
 * A token's resolved value changes for two reasons: the palette was re-seeded
 * (`setPaletteConfig()`, covered by `usePaletteVersion`), or the scheme /
 * contrast tier flipped. This store covers the second.
 *
 * Both axes are the ones `@dark` and `@hc` resolve against (see
 * `src/components/Root.tsx`): the `data-schema` / `data-contrast` attributes on
 * `<html>`, and the `prefers-color-scheme` / `prefers-contrast` media queries
 * they fall back to. An attribute flip is invisible to `matchMedia` and a system
 * flip is invisible to a `MutationObserver`, so both are watched.
 */
const APPEARANCE_QUERIES = [
  '(prefers-color-scheme: dark)',
  '(prefers-contrast: more)',
];
const APPEARANCE_ATTRIBUTES = ['data-schema', 'data-contrast'];

let appearanceVersion = 0;
let stopWatchingAppearance: (() => void) | null = null;

const appearanceListeners = new Set<() => void>();

function onAppearanceChange() {
  appearanceVersion++;

  appearanceListeners.forEach((listener) => listener());
}

function watchAppearance(): () => void {
  const teardowns: (() => void)[] = [];

  // Guarded rather than assumed: jsdom ships neither `matchMedia` nor a
  // `MediaQueryList` in every version, and a consumer's unit tests are exactly
  // where a hook like this gets mounted. Losing one source of change is a stale
  // value; throwing is a broken render.
  if (typeof window.matchMedia === 'function') {
    for (const query of APPEARANCE_QUERIES) {
      const list = window.matchMedia(query);

      if (typeof list?.addEventListener !== 'function') continue;

      list.addEventListener('change', onAppearanceChange);
      teardowns.push(() =>
        list.removeEventListener('change', onAppearanceChange),
      );
    }
  }

  if (typeof MutationObserver === 'function' && document.documentElement) {
    const observer = new MutationObserver(onAppearanceChange);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: APPEARANCE_ATTRIBUTES,
    });

    teardowns.push(() => observer.disconnect());
  }

  return () => teardowns.forEach((teardown) => teardown());
}

function subscribeAppearance(listener: () => void): () => void {
  appearanceListeners.add(listener);

  if (appearanceListeners.size === 1 && typeof window !== 'undefined') {
    stopWatchingAppearance = watchAppearance();
  }

  return () => {
    appearanceListeners.delete(listener);

    if (!appearanceListeners.size) {
      stopWatchingAppearance?.();
      stopWatchingAppearance = null;
    }
  };
}

function getAppearanceVersion(): number {
  return appearanceVersion;
}

function getServerAppearanceVersion(): number {
  return 0;
}

/**
 * Re-render on a scheme / contrast change. Returns the version rather than the
 * state so the snapshot is a primitive — the same reason `usePaletteVersion`
 * does, see `src/tokens/palette-config.ts`.
 */
function useAppearanceVersion(): number {
  return useSyncExternalStore(
    subscribeAppearance,
    getAppearanceVersion,
    getServerAppearanceVersion,
  );
}

// ============================================================================
// React bindings
// ============================================================================

/**
 * The value is read out of the DOM, so it re-resolves whenever the palette is
 * re-seeded or the scheme / contrast tier flips, and it is `fallback ?? null`
 * during SSR. The layout effect is what covers the first commit: a consumer
 * rendered in the same pass as `<Root>` reads before the token block lands.
 */
function useResolvedTokens<T extends string>(
  tokens: readonly T[],
  key: string,
  options: ResolveTokenOptions,
): Record<T, string | null> {
  const { element, fallback } = options;
  const paletteVersion = usePaletteVersion();
  const appearance = useAppearanceVersion();

  const [values, setValues] = useState(() =>
    resolveTokenValues(tokens, options),
  );

  useLayoutEffect(() => {
    setValues((previous) => {
      const next = resolveTokenValues(tokens, { element, fallback });

      return isSameRecord(previous, next) ? previous : next;
    });
    // `tokens` is a fresh array on all but the first render, so `key` — its
    // joined identity — is what belongs in the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, element, fallback, paletteVersion, appearance]);

  return values;
}

/** Keeps the previous object when nothing moved, so it stays usable as a dep. */
function isSameRecord<T extends Record<string, string | null>>(
  a: T,
  b: T,
): boolean {
  const keys = Object.keys(b);

  if (Object.keys(a).length !== keys.length) return false;

  return keys.every((key) => a[key] === b[key]);
}

/**
 * {@link resolveTokenValue} as a hook: re-renders when the palette is re-seeded
 * or the scheme / contrast tier flips.
 *
 * ```tsx
 * const accent = useTokenValue('#purple');
 *
 * return <Chart series={{ color: accent ?? '#000' }} />;
 * ```
 */
export function useTokenValue(
  token: string,
  options: ResolveTokenOptions = {},
): string | null {
  return useResolvedTokens([token], token, options)[token];
}

/**
 * {@link resolveTokenValues} as a hook. The returned object keeps its identity
 * while the values are unchanged, so it is safe as a dependency of the theme
 * object built from it — and the token list may be an inline literal.
 *
 * ```tsx
 * const colors = useTokenValues(['#surface', '#surface-text', '#border']);
 *
 * const appearance = useMemo(() => toStripeAppearance(colors), [colors]);
 * ```
 */
export function useTokenValues<T extends string>(
  tokens: readonly T[],
  options: ResolveTokenOptions = {},
): Record<T, string | null> {
  return useResolvedTokens(tokens, tokens.join(' '), options);
}

/**
 * {@link resolvePresetValues} as a hook.
 *
 * ```tsx
 * const { fontFamily, fontSize } = usePresetValues('s3');
 * ```
 */
export function usePresetValues(
  preset: string,
  options: ResolveTokenOptions = {},
): ResolvedPreset {
  const { element, fallback } = options;
  const paletteVersion = usePaletteVersion();
  const appearance = useAppearanceVersion();

  const [values, setValues] = useState(() =>
    resolvePresetValues(preset, options),
  );

  useLayoutEffect(() => {
    setValues((previous) => {
      const next = resolvePresetValues(preset, { element, fallback });

      return isSameRecord(previous, next) ? previous : next;
    });
  }, [preset, element, fallback, paletteVersion, appearance]);

  return values;
}
