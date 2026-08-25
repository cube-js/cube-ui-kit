---
'@cube-dev/ui-kit': minor
---

Added `useSchema()` and `useHighContrast()` — the JS answer to the `@dark` and `@hc` states, for the two places a state map cannot reach: surfaces that take values rather than CSS (a Vega spec, a CodeMirror/Monaco theme, an iframe) and controls whose value *is* the ambient condition. Both follow the `<html data-schema>` / `<html data-contrast>` opt-in first and `prefers-color-scheme` / `prefers-contrast` second, exactly as the states do, and re-render on a change. `resolveSchema()`, `resolveHighContrast()` and `subscribeSchema()` cover the same ground outside React. Styling still belongs in a state map.
