---
'@cube-dev/ui-kit': patch
---

Consolidated style handlers to reduce redundant handler registrations:

- `widthStyle` now handles `minWidth`, `maxWidth` directly
- `heightStyle` now handles `minHeight`, `maxHeight` directly
- `presetStyle` now handles all typography props (`fontSize`, `lineHeight`, `fontWeight`, `letterSpacing`, `textTransform`, `fontStyle`, `fontFamily`, `font`) with or without `preset` defined

Font props support number values: `fontSize={14}` → `font-size: 14px`, `fontWeight={700}` → `font-weight: 700`.

The `font` prop has special handling: `font="monospace"` → `var(--monospace-font)`, `font={true}` → `var(--font)`, `font="CustomFont"` → `CustomFont, var(--font)`. The `fontFamily` prop is a direct value without fallback.
