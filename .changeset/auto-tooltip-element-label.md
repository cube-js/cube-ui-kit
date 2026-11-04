---
"@cube-dev/ui-kit": patch
---

`tooltip={{ title, auto: true }}` now works when the label is an element, such as a hash coloured apart from its message: the title shows only while the label is cut off. Before, an element label got no tooltip at all with this setting. This applies wherever the overflow tooltip measures a label, such as `TextItem`, `Item` (an element `description` too), `Button` and a classic `Radio`. The automatic tooltip without a `title` still measures only string labels.
