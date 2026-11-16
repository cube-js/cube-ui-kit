## Checking styles

- To see the CSS that styles produce, run `pnpm probe styles '<json>'`. It loads `configure()` and the states from `src/components/Root.tsx`, and the palette from `src/`. `docs/rules/probe.md` has the other modes.
- `tasty:styles` with UI Kit's `--setup` reads the build in `dist/`, which is missing or out of date while you work here.
