---
'@cube-dev/ui-kit': minor
---

Add a `current` type to `Item` (plus `Item.Action`, and by inheritance `ItemButton`) and to `Button`. Fill, border and label are derived from the inherited text color, so the element adopts the color of whatever container it sits in — alerts, banners, dark overlays, tooltips — with no `theme` to pick. The label stays fully opaque, and the type is theme-agnostic.

The two components take the shape their neutral types take: on `Item` it matches the `item` type (no border, nothing painted at rest, the fill stepping in on hover/pressed/selected), while on `Button` it is a standalone chip (a resting `#current.03` fill inside a `#current.08` border).
