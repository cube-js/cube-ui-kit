import { useLayoutEffect, useRef } from 'react';

import { setSchemaOverride } from './colorSchemaBridge';

import type { ReactElement } from 'react';

/**
 * Storybook decorator signature. Defined locally because the `Decorator` type
 * isn't re-exported through `@storybook/react-vite`'s `export *` chain in this
 * version (`Meta` / `StoryFn` work, but `Decorator` does not). The shape
 * matches `@storybook/react`'s `Decorator<TArgs = StrictArgs>`.
 */
type StoryDecorator = (
  Story: (...args: any[]) => ReactElement | null,
  context?: any,
) => ReactElement | null;

/**
 * Drives the `data-schema` attribute on `<html>`.
 *  - `'dark'` / `'light'` — force the corresponding schema
 *  - `'auto'` — clear the attribute and fall back to `prefers-color-scheme`
 */
export type ColorSchema = 'light' | 'dark' | 'auto';

/**
 * Drives the `data-contrast` attribute on `<html>`.
 *  - `'high'` / `'normal'` — force the corresponding contrast level
 *  - `'auto'` — clear the attribute and fall back to `prefers-contrast`
 */
export type ContrastMode = 'normal' | 'high' | 'auto';

export interface WithColorSchemaOptions {
  /** Color schema applied via `<html data-schema=…>`. */
  schema?: ColorSchema;
  /** Contrast mode applied via `<html data-contrast=…>`. */
  contrast?: ContrastMode;
}

/**
 * Storybook decorator that switches a story into a different color schema by
 * driving the `data-schema` / `data-contrast` attributes on `<html>` (the same
 * attributes the global `@dark` / `@hc` predefined states resolve against —
 * see `src/components/Root.tsx`).
 *
 * The body itself is `fill: '#surface'` (see `src/components/GlobalStyles.tsx`),
 * so flipping `data-schema` is enough to repaint the whole story canvas — no
 * extra wrappers needed.
 *
 * `data-schema` writes go through `colorSchemaBridge` so the per-story
 * override always wins over the `storybook-dark-mode` toolbar (which writes
 * the same attribute via the channel listener in `.storybook/preview.jsx`).
 * `data-contrast` is unmanaged by the addon and stays a direct DOM write.
 *
 * Implemented synchronously in `useLayoutEffect`, so the schema switches
 * before paint (no flash). The bridge restores the toolbar value on unmount,
 * and `data-contrast` restores its prior literal value.
 *
 * @example
 *   export const DarkVariant = MyTemplate.bind({});
 *   DarkVariant.decorators = [withColorSchema({ schema: 'dark' })];
 */
export const withColorSchema = (
  options: WithColorSchemaOptions = {},
): StoryDecorator => {
  const { schema, contrast } = options;

  const ColorSchemaDecorator: StoryDecorator = (Story) => {
    const previousContrastRef = useRef<string | null>(null);

    useLayoutEffect(() => {
      const html = document.documentElement;

      previousContrastRef.current = html.getAttribute('data-contrast');

      if (schema === 'auto') {
        setSchemaOverride(null);
      } else if (schema) {
        setSchemaOverride(schema);
      }

      if (contrast === 'auto') {
        html.removeAttribute('data-contrast');
      } else if (contrast) {
        html.setAttribute(
          'data-contrast',
          contrast === 'high' ? 'high' : 'normal',
        );
      }

      return () => {
        if (schema) {
          setSchemaOverride(null);
        }

        if (contrast) {
          const prev = previousContrastRef.current;

          if (prev === null) {
            html.removeAttribute('data-contrast');
          } else {
            html.setAttribute('data-contrast', prev);
          }
        }
      };
    }, []);

    return <Story />;
  };

  (ColorSchemaDecorator as { displayName?: string }).displayName =
    `WithColorSchema(${schema ?? 'auto'},${contrast ?? 'auto'})`;

  return ColorSchemaDecorator;
};

/** Convenience preset: switches the story into the dark schema. */
export const withDarkSchema: StoryDecorator = withColorSchema({
  schema: 'dark',
});

/** Convenience preset: switches the story into the high-contrast schema. */
export const withHighContrast: StoryDecorator = withColorSchema({
  contrast: 'high',
});
