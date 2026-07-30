---
'@cube-dev/ui-kit': patch
---

Keep `#pink` resolving. The legacy alias was dropped while `tasty.config.ts`, `Usage.docs.mdx` and the `pink` key in the Tasty token augmentation all still advertised it, so consumer styles using it would have silently stopped resolving with types still reporting the token as valid. Restored as the same scheme-static literal.

Fix `CopySnippet`'s `serif` variant rendering monospace. Moving the code element to the `s3` / `t3` presets lost the font family: `s3` carries `fontFamily: var(--font-mono)` but `t3` sets no family at all, so `serif` fell back to the `<code>` element's UA monospace default. The family is explicit again — monospace by default, the design system's default stack under `serif`.
