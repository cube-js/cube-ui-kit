export {};

// Keep this interface lean. Each entry contributes ~112 template-literal
// strings to `ColorValue` (one per opacity step), so a large `TastyNamedColors`
// makes TypeScript's serialized ColorValue type explode (TS7056). Per-theme
// accent variants like `success-accent-surface-2` are intentionally omitted —
// they're typically read from a theme dispatch table and still type-check via
// the `(string & {})` fallback in tasty's `ColorValue`.
declare module '@tenphi/tasty' {
  interface TastyNamedColors {
    // ---- Glaze: neutral palette (default theme, unprefixed) ----
    surface: true;
    'surface-2': true;
    'surface-3': true;
    'surface-text': true;
    'surface-text-soft': true;
    'surface-text-soft-2': true;
    'surface-2-text': true;
    'surface-2-text-soft': true;
    'surface-3-text': true;
    'surface-3-text-soft': true;

    // ---- Glaze: accent system (default theme, unprefixed) ----
    'accent-surface': true;
    'accent-surface-2': true;
    'accent-surface-3': true;
    'accent-surface-text': true;
    'accent-text': true;
    'accent-icon': true;
    // Note: `accent-surface-hover` (and its per-theme `<theme>-accent-surface-hover`
    // variants + `<theme>-hover` aliases) are intentionally omitted from this
    // type list to stay under TS7056. They resolve at runtime and still
    // type-check via tasty's `(string & {})` fallback in `ColorValue`.

    // ---- Other primitives ----
    placeholder: true;
    focus: true;
    overlay: true;
    'surface-inverse': true;
    'shadow-sm': true;
    'shadow-md': true;
    'shadow-lg': true;

    // Per-theme prefixed tokens (e.g. `success-surface`, `success-accent-surface`,
    // `success-accent-text`, etc.) are intentionally NOT enumerated here. They
    // would explode the serialized `ColorValue` union (TS7056) and are typically
    // referenced from theme dispatch tables (`src/data/themes.ts`) rather than
    // typed by hand. They still resolve via the `(string & {})` fallback in
    // tasty's `ColorValue`.

    // ---- Legacy aliases (resolved via #token references in src/tokens/colors.ts) ----
    purple: true;
    'purple-text': true;
    'purple-icon': true;
    'purple-bg': true;
    'purple-01': true;
    'purple-02': true;
    'purple-03': true;
    'purple-04': true;
    dark: true;
    'dark-01': true;
    'dark-02': true;
    'dark-03': true;
    'dark-04': true;
    'dark-05': true;
    text: true;
    primary: true;
    'primary-text': true;
    'primary-icon': true;
    'primary-bg': true;
    disabled: true;
    'disabled-bg': true;
    'disabled-text': true;
    danger: true;
    'danger-bg': true;
    'danger-text': true;
    'danger-icon': true;
    success: true;
    'success-bg': true;
    'success-text': true;
    'success-icon': true;
    warning: true;
    'warning-bg': true;
    'warning-text': true;
    'warning-icon': true;
    note: true;
    'note-bg': true;
    'note-text': true;
    'note-icon': true;
    white: true;
    light: true;
    'light-grey': true;
    black: true;
    pink: true;
    'pink-01': true;
    'pink-02': true;
    border: true;
    clear: true;
    shadow: true;
    draft: true;
    minor: true;
  }

  interface TastyPresetNames {
    h1: true;
    h2: true;
    h3: true;
    h4: true;
    h5: true;
    h6: true;
    t1: true;
    t2: true;
    t2m: true;
    t3: true;
    t3m: true;
    t4: true;
    t4m: true;
    m1: true;
    m2: true;
    m3: true;
    p1: true;
    p2: true;
    p3: true;
    p4: true;
    c1: true;
    c2: true;
    tag: true;
    default: true;
  }

  interface TastyThemeNames {
    default: true;
    danger: true;
    special: true;
    success: true;
    warning: true;
    note: true;
  }
}
