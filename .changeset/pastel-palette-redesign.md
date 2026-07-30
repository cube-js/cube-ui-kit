---
'@cube-dev/ui-kit': minor
---

Make the pastel palette the default: the app seed moves to saturation 100 with
`pastel: true`, producing a softer, more even spread across hues.

Both are `PaletteConfig` defaults rather than a rewritten recipe, so anything that
already tunes the palette at runtime keeps working and can opt back out with
`{ saturation: 80, pastel: false }`.

The `code-*` syntax family is unaffected. It answers to its own seed, which now
reads a separate `DEFAULT_CODE_SATURATION` (still 80) instead of sharing
`DEFAULT_SATURATION`; sharing it would have pulled syntax colors to 100 as a side
effect of moving the app seed. `pastel` was already held off the code theme.
