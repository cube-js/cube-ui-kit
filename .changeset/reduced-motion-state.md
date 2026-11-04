---
'@cube-dev/ui-kit': minor
---

Add the `@reduced-motion` global state, which `<Root>` registers beside `@dark` and `@hc`. It matches `@media (prefers-reduced-motion: reduce)`, so a style can write `animationPlayState: { '': 'running', '@reduced-motion': 'paused' }`. UI Kit's published `tasty.config.ts` lists it, so `tasty/valid-state-key` and `tasty/no-unknown-state-alias` accept it in a project that extends it. The `Cube` spinner and the table's loading sweep now use it.
