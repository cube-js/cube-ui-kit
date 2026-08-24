---
'@cube-dev/ui-kit': minor
---

New: `resolveTokenValue()`, `resolveTokenValues()` and `resolvePresetValues()`, plus the `useTokenValue()` / `useTokenValues()` / `usePresetValues()` hooks — a supported way to ask the kit for a design token's _resolved_ value, for consumers rendering into a surface our stylesheets do not reach: a third-party iframe (Stripe Elements), a CodeMirror or Monaco theme, a chart spec. Those take colors, lengths and font descriptors as values, and `var(--purple-color)` means nothing to them.

Reading tokens off `getComputedStyle()` by hand has two failure modes, and both are silent. Tasty registers an `@property` rule for every custom property whose type it can infer, so an undeclared token reads back as that rule's `initial-value` — `rgba(0, 0, 0, 0)` for a color, `0px` for a length — rather than as an empty string. And `Root` declares the token block on `<body>`, so `<html>`, a detached node, and a tree that has not mounted `Root` yet all return those placeholders. The helpers read from the declaration site by default, return `null` (or an explicit `fallback`) instead of a placeholder, and warn once in development; a token whose declared value genuinely is `transparent` or `0`, such as `#clear` or `$sharp-radius`, still comes through. The hooks re-resolve when the palette is re-seeded or the scheme / contrast tier flips.

All six take `{ element, fallback }` — pass `element` to resolve against a local override (a subtree with its own `tokens` prop, or one under a differing `data-schema`) instead of the document.
