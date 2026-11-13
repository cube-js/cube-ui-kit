## Checking styles

- To see the CSS that styles produce with UI Kit's units, presets and states, run `tasty:styles '<json>' --setup @cube-dev/ui-kit/dist/components/Root.js`, plus `--setup <file>` for each module of your app that calls `configure()`. In a monorepo, run it from the package whose styles you check.
