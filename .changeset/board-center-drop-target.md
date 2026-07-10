---
"@cube-dev/ui-kit": patch
---

`Board`: a board now becomes the drop target when the dragged widget's center enters it, instead of only once its top-left corner is inside. Empty boards open (expand to preview the drop) as soon as the widget's center touches them. The landing/placeholder stays anchored to the grabbed point, so it keeps tracking the floating widget.
