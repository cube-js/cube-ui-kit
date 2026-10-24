---
'@cube-dev/ui-kit': patch
---

A virtualized `ListBox` and `Tree`, the `Slider` value label and `DatePicker` segments now size and place themselves through Tasty tokens instead of inline `style`, and render the same. A virtualized `ListBox` takes its height from a spacer, so a `listStyles` height now applies to it: a cap such as `height: 'max 30x'` still caps the list, which now scrolls its whole length at once, and a fixed height, which the inline height used to replace, now sets it. A `position` in `listStyles`, or a `position`, `inset` or `transform` in an option's `styles`, now takes over from the virtualizer's value; before, the inline value won. `Tree` now wraps its rows in a Tasty element with `data-qa="TreeSizer"`.
