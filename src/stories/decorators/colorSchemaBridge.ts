/**
 * Single owner of the `<html data-schema="…">` attribute used by the
 * Glaze-generated `@dark` predefined state in `src/components/Root.tsx`.
 *
 * Two writers route through here:
 *   - The `storybook-dark-mode` addon's toolbar toggle (via the
 *     `DARK_MODE` channel event in `.storybook/preview.jsx`).
 *   - The per-story `withColorSchema` decorator in this folder.
 *
 * `overrideSchema` always wins over `toolbarSchema`, so a story explicitly
 * forced into dark/light cannot be clobbered by the addon's async init.
 *
 * NOTE: lives under `src/stories/decorators/` (not `.storybook/`) so the
 * decorator can import it without crossing the TypeScript include boundary.
 */

export type Schema = 'light' | 'dark';

let toolbarSchema: Schema | null = null;
let overrideSchema: Schema | null = null;

const apply = (): void => {
  if (typeof document === 'undefined') return;

  const next = overrideSchema ?? toolbarSchema;

  if (next == null) {
    document.documentElement.removeAttribute('data-schema');
  } else {
    document.documentElement.setAttribute('data-schema', next);
  }
};

/** Set by the `storybook-dark-mode` channel listener in `preview.jsx`. */
export const setToolbarSchema = (schema: Schema | null): void => {
  toolbarSchema = schema;
  apply();
};

/**
 * Set by the per-story `withColorSchema` decorator.
 * Pass `null` to release the override and fall back to the toolbar value.
 */
export const setSchemaOverride = (schema: Schema | null): void => {
  overrideSchema = schema;
  apply();
};
