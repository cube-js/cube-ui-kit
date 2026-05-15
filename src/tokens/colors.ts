import { PALETTE_TOKENS } from './palette';

import type { Styles } from '@tenphi/tasty';

/**
 * Color tokens with `#` prefix for tasty color definitions.
 *
 * The base values come from the Glaze-generated palette (`palette.ts`):
 * `#surface`, `#surface-text*`, `#border`, `#focus`, `#disabled`, `#pink`,
 * `#shadow-*`, `#overlay`, the unprefixed `#accent-*` family, and the per-theme
 * `#primary-*` / `#purple-*` / `#success-*` / `#danger-*` / `#warning-*` /
 * `#note-*` families.
 *
 * Each Glaze token is a state map (`{ '': '...', '@dark': '...', '@hc': '...' }`),
 * giving us light, dark, and high-contrast variants for free. The `@dark` /
 * `@hc` predefined states are wired up globally in `src/components/Root.tsx`.
 *
 * The aliases below preserve backward compatibility with every legacy
 * `#name` used across components, stories, and tests. Each alias resolves
 * to a current Glaze token via tasty's `#token` reference syntax.
 */

const LEGACY_ALIASES: Styles = {
  // ---- Neutral text scale (legacy `#dark*`) ----
  '#text': '#surface-text-soft',
  '#dark': '#surface-text',
  '#dark-01': '#surface-text',
  '#dark-02': '#surface-text-soft',
  '#dark-03': '#surface-text-soft-2',
  '#dark-04': '#placeholder',
  '#dark-05': '#border',

  // Fixed-mode counterpart to `#dark`. Resolves to the same L≈12 surface
  // but uses Glaze `mode: 'fixed'` so it does NOT invert in dark schemes.
  // Use this whenever the design intentionally pins a dark color regardless
  // of scheme. Points at `#special-surface` (`mode: 'fixed'`, L=12),
  // emitted by the standalone `specialTheme` in `palette.ts` — the canonical
  // source of fixed-mode color tokens for `special`-variant components.
  '#fixed-dark': '#special-surface',

  // Fixed-mode counterpart to `#primary-text`. `#primary-text` is anchored
  // to `surface` with `mode: 'auto'`, so it flips to a *light* purple in
  // dark schemes (correct on body content, which also inverts). When the
  // local fill is a fixed color instead (an always-white pill, etc.), the
  // adaptive text loses contrast (light purple on white) in dark mode.
  // Points at `#special-accent-text` (`mode: 'fixed'`, cr 6–8.5 vs fixed
  // white) — a dark purple readable on a white surface that stays put
  // across schemes.
  '#fixed-primary-text': '#special-accent-text',

  // ---- Misc neutral ----
  '#minor': '#surface-text-soft.65',
  '#shadow': '#shadow-md',
  '#light': '#surface-3',
  '#dark-bg': '#surface-2',
  '#clear': 'transparent',

  // Pink: independent hue, scheme-static (no Glaze adaptation).
  '#pink': 'okhsl(5 100% 67%)',

  // ---- Disabled state aliases ----
  // `#disabled-surface` and `#disabled-surface-text` are emitted directly by
  // the Glaze palette (`palette.ts`) as scheme-symmetric, contrast-driven
  // tokens — no alias needed here. `#disabled` stays as a brand-tinted
  // backwards-compat anchor for the per-theme `#<theme>-disabled` aliases below.

  // ---- Primary / Purple legacy ----
  '#primary': '#primary-accent-surface',
  '#primary-text': '#primary-accent-text',
  '#primary-text-soft': '#primary-accent-text-soft',
  '#primary-bg': '#primary-surface',
  '#primary-icon': '#primary-accent-icon',
  '#primary-hover': '#primary-accent-surface-hover',
  '#primary-desaturated': '#primary-accent-surface-2',
  '#primary-disabled': '#disabled',

  '#purple': '#purple-accent-surface',
  '#purple-text': '#purple-accent-text',
  '#purple-text-soft': '#purple-accent-text-soft',
  '#purple-bg': '#purple-surface',
  '#purple-icon': '#purple-accent-icon',
  '#purple-hover': '#purple-accent-surface-hover',
  '#purple-disabled': '#disabled',

  // Purple scale (gradient/accent shades) — mapped to the accent-surface ramp.
  '#purple-01': '#purple-accent-surface',
  '#purple-02': '#purple-accent-surface-2',
  '#purple-03': '#purple-accent-surface-3',
  '#purple-04': '#purple-surface',

  // ---- Danger ----
  '#danger': '#danger-accent-surface',
  '#danger-text': '#danger-accent-text',
  '#danger-text-soft': '#danger-accent-text-soft',
  '#danger-bg': '#danger-surface',
  '#danger-icon': '#danger-accent-icon',
  '#danger-hover': '#danger-accent-surface-hover',
  '#danger-desaturated': '#danger-accent-surface-2',
  '#danger-disabled': '#disabled',

  // ---- Success ----
  '#success': '#success-accent-surface',
  '#success-text': '#success-accent-text',
  '#success-text-soft': '#success-accent-text-soft',
  '#success-bg': '#success-surface',
  '#success-icon': '#success-accent-icon',
  '#success-hover': '#success-accent-surface-hover',
  '#success-desaturated': '#success-accent-surface-2',
  '#success-disabled': '#disabled',

  // ---- Warning ----
  '#warning': '#warning-accent-surface',
  '#warning-text': '#warning-accent-text',
  '#warning-text-soft': '#warning-accent-text-soft',
  '#warning-bg': '#warning-surface',
  '#warning-icon': '#warning-accent-icon',
  '#warning-hover': '#warning-accent-surface-hover',
  '#warning-desaturated': '#warning-accent-surface-2',
  '#warning-disabled': '#disabled',

  // ---- Note ----
  '#note': '#note-accent-surface',
  '#note-text': '#note-accent-text',
  '#note-text-soft': '#note-accent-text-soft',
  '#note-bg': '#note-surface',
  '#note-icon': '#note-accent-icon',
  '#note-hover': '#note-accent-surface-hover',
  '#note-desaturated': '#note-accent-surface-2',
  '#note-disabled': '#disabled',
};

/**
 * Combined color token map: Glaze-generated palette + legacy aliases.
 *
 * `#white` and `#black` are intentionally omitted — they are built-in
 * tasty named colors and resolve automatically.
 */
export const COLOR_TOKENS: Styles = {
  ...PALETTE_TOKENS,
  ...LEGACY_ALIASES,
};
