---
"@cube-dev/ui-kit": patch
---

UI Kit now pins Tasty 3.19.2 (was 3.19.1), which changes no styles. Its `tasty:styles` agent tool now warns about a `#color` or `$token` reference missing from the loaded config, but only when a `--setup` module defines tokens with `configure()`. UI Kit's palette is not part of that config, so with such a setup the tool also warns about UI Kit colors like `#surface`: look those up with `uikit:colors`.
