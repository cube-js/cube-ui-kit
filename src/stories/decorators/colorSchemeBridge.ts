/**
 * Single owner of the `<html data-schema="…">` attribute used by the
 * Glaze-generated `@dark` predefined state in `src/components/Root.tsx`.
 *
 * Two writers route through here:
 *   - The `storybook-dark-mode` addon's toolbar toggle (via the
 *     `DARK_MODE` channel event in `.storybook/preview.jsx`).
 *   - The per-story `withColorScheme` decorator in this folder.
 *
 * `overrideScheme` always wins over `toolbarScheme`, so a story explicitly
 * forced into dark/light cannot be clobbered by the addon's async init.
 *
 * NOTE: lives under `src/stories/decorators/` (not `.storybook/`) so the
 * decorator can import it without crossing the TypeScript include boundary.
 */

export type Scheme = 'light' | 'dark';

let toolbarScheme: Scheme | null = null;
let overrideScheme: Scheme | null = null;

const apply = (): void => {
  if (typeof document === 'undefined') return;

  const next = overrideScheme ?? toolbarScheme;

  if (next == null) {
    document.documentElement.removeAttribute('data-schema');
  } else {
    document.documentElement.setAttribute('data-schema', next);
  }
};

/** Set by the `storybook-dark-mode` channel listener in `preview.jsx`. */
export const setToolbarScheme = (scheme: Scheme | null): void => {
  toolbarScheme = scheme;
  apply();
};

/**
 * Set by the per-story `withColorScheme` decorator.
 * Pass `null` to release the override and fall back to the toolbar value.
 */
export const setSchemeOverride = (scheme: Scheme | null): void => {
  overrideScheme = scheme;
  apply();
};
