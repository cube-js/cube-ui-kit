import { useLayoutEffect, useRef } from 'react';

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
 *  - `'dark'` / `'light'` — force the corresponding scheme
 *  - `'auto'` — clear the attribute and fall back to `prefers-color-scheme`
 */
export type ColorScheme = 'light' | 'dark' | 'auto';

/**
 * Drives the `data-contrast` attribute on `<html>`.
 *  - `'high'` / `'normal'` — force the corresponding contrast level
 *  - `'auto'` — clear the attribute and fall back to `prefers-contrast`
 */
export type ContrastMode = 'normal' | 'high' | 'auto';

export interface WithColorSchemeOptions {
  /** Color scheme applied via `<html data-schema=…>`. */
  scheme?: ColorScheme;
  /** Contrast mode applied via `<html data-contrast=…>`. */
  contrast?: ContrastMode;
}

/**
 * Storybook decorator that switches a story into a different color scheme by
 * setting `data-schema` / `data-contrast` attributes on `<html>` (the same
 * attributes the global `@dark` / `@hc` predefined states resolve against —
 * see `src/components/Root.tsx`).
 *
 * The body itself is `fill: '#surface'` (see `src/components/GlobalStyles.tsx`),
 * so flipping `data-schema` is enough to repaint the whole story canvas — no
 * extra wrappers needed.
 *
 * Implemented as a synchronous DOM mutation in `useLayoutEffect`, so the
 * scheme switches before paint (no flash). Any pre-existing attribute values
 * are restored when the story unmounts.
 *
 * @example
 *   export const DarkVariant = MyTemplate.bind({});
 *   DarkVariant.decorators = [withColorScheme({ scheme: 'dark' })];
 */
export const withColorScheme = (
  options: WithColorSchemeOptions = {},
): StoryDecorator => {
  const { scheme, contrast } = options;

  const ColorSchemeDecorator: StoryDecorator = (Story) => {
    const previousRef = useRef<{
      schema: string | null;
      contrast: string | null;
    }>({ schema: null, contrast: null });

    useLayoutEffect(() => {
      const html = document.documentElement;

      previousRef.current = {
        schema: html.getAttribute('data-schema'),
        contrast: html.getAttribute('data-contrast'),
      };

      if (scheme === 'auto') {
        html.removeAttribute('data-schema');
      } else if (scheme) {
        html.setAttribute('data-schema', scheme);
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
        const prev = previousRef.current;

        if (prev.schema === null) {
          html.removeAttribute('data-schema');
        } else {
          html.setAttribute('data-schema', prev.schema);
        }

        if (prev.contrast === null) {
          html.removeAttribute('data-contrast');
        } else {
          html.setAttribute('data-contrast', prev.contrast);
        }
      };
    }, []);

    return <Story />;
  };

  (ColorSchemeDecorator as { displayName?: string }).displayName =
    `WithColorScheme(${scheme ?? 'auto'},${contrast ?? 'auto'})`;

  return ColorSchemeDecorator;
};

/** Convenience preset: switches the story into the dark scheme. */
export const withDarkScheme: StoryDecorator = withColorScheme({
  scheme: 'dark',
});

/** Convenience preset: switches the story into the high-contrast scheme. */
export const withHighContrast: StoryDecorator = withColorScheme({
  contrast: 'high',
});
