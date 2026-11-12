---
'@cube-dev/ui-kit': patch
---

**Palette:** the label of a selected `outline` or `outline-2` item (a selected `Radio.Group type="button"` button, an `ItemButton type="outline" isSelected`, a `ToggleGroup` item) now meets WCAG AA (4.5:1) in light mode: it measured 4.47:1 on `outline` and 4.20:1 on `outline-2`, and now 4.89:1 and 4.59:1. The `accent-text-soft` tokens behind it, which links and selected `clear` items use too, are a little darker in light mode and a little lighter in dark mode. A selected `outline` or `clear` label also takes the stronger `accent-text` while keyboard focused, as it already did on hover, because its fill darkens then too. High contrast and a palette seeded with your own `accent` color are unchanged.
