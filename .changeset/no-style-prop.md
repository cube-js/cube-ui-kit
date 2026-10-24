---
'@cube-dev/ui-kit': patch
---

A virtualized `ListBox` and `Tree`, the `Slider` value label and `DatePicker` segments now size and place themselves through Tasty tokens instead of inline `style`, and render the same. In a virtualized `ListBox`, a `height` or `position` in `listStyles`, or a `position`, `inset` or `transform` in an option's `styles`, now takes over from the virtualizer's value; before, the inline value won. `Tree` now wraps its rows in a Tasty element with `data-qa="TreeSizer"`.
