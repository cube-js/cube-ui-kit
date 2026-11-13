## Styling

- Style with Tasty (the `styles` prop and `tasty()`) and UI Kit's tokens, units and presets.
- Colors are UI Kit palette tokens, written `#name`, such as `#surface`, `#surface-text` or `#danger-accent-text`. Never paste raw `#rrggbb`, `rgb()` or `hsl()` values.
- To find a color token, run `pnpm probe tokens --filter <part of its name>`, with `--scheme dark` or `--hc` for the other schemes. It reads the palette in `src/`. `uikit:colors` reads the build in `dist/`, which is missing or out of date while you work here. Put a text token on its base. The Usage guide lists the legacy aliases that new code avoids.
