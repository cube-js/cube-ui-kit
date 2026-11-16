## Where colors come from

- UI Kit's palette is a Glaze palette, built in `src/tokens/palette.ts` from the seeds in `src/tokens/palette-config.ts`. Components use its tokens: follow the UI Kit rule.
- A color the palette lacks is added to the palette, not made in a component with a Glaze theme or `glaze.color()` of its own. Do not write its dark or high-contrast values by hand. The `glaze-theme` skill explains how to define one.

## Checking a theme

- `glaze:inspect` cannot load UI Kit's palette: `palette.ts` builds it inside `getPalette()` and imports files without extensions. After a palette change, compare `pnpm probe tokens --json` before and after in all four schemes, as `docs/rules/probe.md` shows, and run `pnpm test -- src/tokens`.
- To try one color, such as a brand color, before you add it, run `glaze:color <color> --base <surface> --contrast AA`.
- To check two literal colors, run `glaze:contrast <text> <background>`.
