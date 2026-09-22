---
"@cube-dev/ui-kit": patch
---

`Item`'s `suffix` slot no longer sits flush against the label, mirroring the same fix on `prefix`. The grid contributes no gap and `Label` drops its own trailing padding for any end content — including a suffix — so nothing was left between the two, while the same glyph in the `rightIcon` slot looked spaced because that slot centres it in a `$size`-wide square. The slot's outer gutter is unchanged, including the case where it yields to a right icon or to a sibling actions run.
