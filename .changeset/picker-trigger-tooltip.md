---
"@cube-dev/ui-kit": minor
---

`Picker`, `FilterPicker` and `ColorPicker` take their trigger's tooltip as `tooltip`, as `Select`, `Button` and `Item` do. `triggerTooltip` still works, but it is deprecated and logs a one-time warning in development. The info badge next to a field's label stays `labelTooltip`.
