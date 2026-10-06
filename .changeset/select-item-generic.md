---
'@cube-dev/ui-kit': patch
---

`Select` keeps its item type, as `ComboBox` and `Picker` do, so a render-function child gets the item from `items` instead of `object`. With a `label`, its `ref` now reaches the field under React 18 as well, and is typed as the `HTMLDivElement` it receives rather than a `DOMRefValue`.
