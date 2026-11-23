---
"@cube-dev/ui-kit": patch
---

UI Kit now pins Tasty 3.19.2 (was 3.19.1), which changes no styles. Its `tasty:styles` agent tool now warns about a `#color` or `$token` reference missing from the loaded config, but only when a `--setup` module's `configure()` sets `tokens` or `presets`. UI Kit's palette and component tokens are not part of that config, so with such a setup the tool also warns about UI Kit names like `#surface` or `$dialog-size`. Those warnings are expected, and `uikit:colors` confirms a color name.
