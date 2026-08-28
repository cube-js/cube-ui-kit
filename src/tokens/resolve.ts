import { useState, useSyncExternalStore } from 'react';

import { useLayoutEffect } from '../utils/react/useLayoutEffect';
import { subscribeScheme } from '../utils/react/useScheme';
import { warn } from '../utils/warnings';

import { getTokens } from './all-tokens';
import { getPaletteVersion, usePaletteVersion } from './palette-config';

/**
 * Resolving a design token to a literal value, for consumers that render into a
 * surface our stylesheets do not reach — a third-party iframe (Stripe Elements),
 * a CodeMirror / Monaco theme object, a Vega spec. Those take colors, lengths and
 * font descriptors as values; `var(--purple-color)` means nothing to them.
 *
 * Doing it by hand fails silently, because a token read from the wrong element
 * does not come back empty. Tasty registers `@property` rules — its own defaults
 * plus one for every custom property whose type it can infer — and an undeclared
 * token reads back as that rule's `initial-value`. Some of those are obvious
 * duds (`rgba(0, 0, 0, 0)` for a `<color>`, `0px` for a `<length>`), but many are
 * ordinary-looking values: off the token block `--gap` reads `4px` rather than
 * the kit's `8px`, `--transition` reads `80ms`, `--radius` reads `6px`. So
 * inspecting the value cannot tell a real token from a miss, in either
 * direction — `#clear` really is `transparent` and `$h2-letter-spacing` really
 * is `0px`.
 *
 * The question that CAN be answered is "are the kit's tokens in effect on this
 * element?", and `$tokens-applied` (see `src/tokens/base.ts`) answers it: it is
 * declared alongside the tokens, so it is present exactly where they are. Off
 * that surface every read is reported as unresolved; on it, the computed value
 * is the truth.
 */

/**
 * Declared by the token block and nothing else — see `src/tokens/base.ts`.
 *
 * Matched by VALUE rather than by presence, because presence is not the signal
 * it looks like: tasty infers a type for the marker as readily as for any other
 * token, registers `@property --tokens-applied` with `initial-value: 0`, and so
 * hands back `0` off the block instead of an empty string. Comparing against the
 * declared value is right either way, and cannot drift from `base.ts`.
 */
const SURFACE_MARKER = '$tokens-applied';

function isTokenSurface(computed: CSSStyleDeclaration): boolean {
  const declared = getTokens()[SURFACE_MARKER];
  const name = tokenToProperty(SURFACE_MARKER);

  if (typeof declared !== 'string' || !name) return false;

  return (
    normalizeValue(computed.getPropertyValue(name)) === normalizeValue(declared)
  );
}

/**
 * Values that mean "this property was never declared" once we already know the
 * token block IS in effect. Only used to catch a token the kit does not declare
 * at all — a typo, or a name from another design system — since for those there
 * is no marker to lean on.
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
   * `data-scheme` / `data-contrast` attribute that differs from the document's.
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
 * Every custom property the kit declares, by name. Membership only — the value
 * is deliberately not consulted, because a token's declared value tells you
 * nothing about whether it is in effect where you read it.
 *
 * Memoized against the palette version, like {@link getTokens} itself.
 */
let knownNamesCache: { version: number; names: Set<string> } | null = null;

function getKnownTokenNames(): Set<string> {
  const version = getPaletteVersion();

  if (!knownNamesCache || knownNamesCache.version !== version) {
    const names = new Set<string>();

    for (const key of Object.keys(getTokens())) {
      const name = tokenToProperty(key);

      if (name) names.add(name);
    }

    knownNamesCache = { version, names };
  }

  return knownNamesCache.names;
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
  onTokenSurface: boolean,
): string | null {
  const name = tokenToProperty(token);

  if (!name) {
    warnOnce(`name:${token}`, `"${token}" is not a valid design token name.`);

    return fallback;
  }

  if (!onTokenSurface) {
    if (!silent) {
      warnOnce(
        `surface:${name}`,
        `Token "${token}" (${name}) was read from an element the design tokens are not in effect on, so any value there is tasty's @property default rather than the kit's. <Root> declares the token block on <body>, so <html>, a detached node, and a tree that has not mounted <Root> yet are all outside it. Pass \`element\` to read from a specific subtree, or \`fallback\` for a value to use instead.`,
      );
    }

    return fallback;
  }

  const value = computed.getPropertyValue(name).trim();

  if (!value) return fallback;

  // On a token surface the computed value is the truth, including a genuinely
  // transparent color or a real `0px`. The only thing left to catch is a name
  // the kit never declares, where an @property default is all there is to read.
  if (
    PLACEHOLDER_VALUES.has(normalizeValue(value)) &&
    !getKnownTokenNames().has(name)
  ) {
    if (!silent) {
      warnOnce(
        `unknown:${name}`,
        `Token "${token}" (${name}) is not declared by the kit, and read back as an unset custom property. Check the name, or pass \`fallback\`.`,
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
  // One read for the whole batch: the marker is a property of the element, not
  // of any individual token.
  const onTokenSurface = isTokenSurface(computed);

  for (const token of tokens) {
    result[token] = readValue(
      computed,
      token,
      fallback,
      silent,
      onTokenSurface,
    );
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
 * The watching itself belongs to `subscribeScheme()` (`src/utils/react/useScheme.ts`),
 * which owns the definition of both axes — the `data-scheme` / `data-contrast`
 * attributes and the media queries they fall back to are the same strings
 * `<Root>` registers `@dark` and `@hc` from. This store only counts the changes,
 * so there is one observer for the document rather than one per concern.
 */
let appearanceVersion = 0;
let stopWatchingAppearance: (() => void) | null = null;

const appearanceListeners = new Set<() => void>();

function onAppearanceChange() {
  appearanceVersion++;

  appearanceListeners.forEach((listener) => listener());
}

function subscribeAppearance(listener: () => void): () => void {
  appearanceListeners.add(listener);

  if (appearanceListeners.size === 1) {
    stopWatchingAppearance = subscribeScheme(onAppearanceChange);
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

/**
 * A version React only ever hands out while rendering on the server or
 * hydrating: `useSyncExternalStore` reads `getServerSnapshot` in exactly those
 * two cases and `getSnapshot` in every other. That makes it a reliable "this
 * render has to match the server's markup" flag — see {@link useResolvedTokens}.
 *
 * A plain client render (`createRoot`) never sees it, so a CSR app still
 * resolves on its first render rather than paying an extra pass.
 */
const HYDRATING = -1;

function getServerAppearanceVersion(): number {
  return HYDRATING;
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
    appearance === HYDRATING
      ? unresolved(tokens, fallback)
      : resolveTokenValues(tokens, options),
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

/**
 * What the server rendered: no DOM, so every token is the fallback. The first
 * client render has to agree with it or hydration reports a mismatch for any
 * consumer that renders the value; the layout effect above replaces it with the
 * resolved values before the browser paints.
 */
function unresolved<T extends string>(
  tokens: readonly T[],
  fallback: string | undefined,
): Record<T, string | null> {
  const result = {} as Record<T, string | null>;

  for (const token of tokens) result[token] = fallback ?? null;

  return result;
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
    appearance === HYDRATING
      ? unresolvedPreset(fallback)
      : resolvePresetValues(preset, options),
  );

  useLayoutEffect(() => {
    setValues((previous) => {
      const next = resolvePresetValues(preset, { element, fallback });

      return isSameRecord(previous, next) ? previous : next;
    });
  }, [preset, element, fallback, paletteVersion, appearance]);

  return values;
}

/** {@link unresolved} for the fixed shape {@link resolvePresetValues} returns. */
function unresolvedPreset(fallback: string | undefined): ResolvedPreset {
  const resolved = {} as ResolvedPreset;

  for (const field of PRESET_FIELDS) resolved[field] = fallback ?? null;

  return resolved;
}
