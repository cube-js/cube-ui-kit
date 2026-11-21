## Components

- Build screens from `@cube-dev/ui-kit` components before writing your own. Before you use a component, read its `.docs.mdx` page next to it in `src/components/`.
- For a new form, use `Form.useController`. Read `src/components/form/Form/modern-form-guide.md` first.

## Styling

- Style with Tasty (the `styles` prop and `tasty()`) and UI Kit's tokens, units and presets.
- Colors are UI Kit palette tokens, written `#name`, such as `#surface`, `#surface-text` or `#danger-accent-text`. Never paste raw `#rrggbb`, `rgb()` or `hsl()` values, in styles or in SVG `fill` and `stroke` attributes. For those, write `currentColor` and set a palette token through Tasty `color` on the SVG or a parent.
- To find a color token, run `pnpm probe tokens --filter <part of its name>`, with `--scheme dark` or `--hc` for the other schemes. It reads the palette in `src/`. `uikit:colors` reads the build in `dist/`, which is missing or out of date while you work here. Put a text token on its base. The Usage guide lists the legacy aliases that new code avoids.

## Typography

- To pick a typography preset (`preset: 't3'`) and see what it sets (size, line height, weight, bold weight and letter spacing), read the "Typography Presets" section of `src/stories/Usage.docs.mdx`.
