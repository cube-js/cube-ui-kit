---
"@cube-dev/ui-kit": patch
---

`tooltip={{ title, auto: true }}` now works when the label is an element, such as a hash coloured apart from its message: the title shows only while the label is cut off. Before, an element label got no tooltip at all with this setting. This applies wherever the overflow tooltip measures a label: `TextItem`, `Item` (an element `description` too), a classic `Radio`, and a `Button` with a string child directly beside its elements (not inside a fragment or another component). The check reruns when the label resizes or the `title` text changes, so derive a string `title` from the same text. The automatic tooltip without a `title` still measures only string labels.
