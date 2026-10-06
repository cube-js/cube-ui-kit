---
'@cube-dev/ui-kit': patch
---

`Select` keeps its item type, as `ComboBox` and `Picker` do, so a render-function child gets the item from `items` instead of `object`. Its `ref` now also reaches it under React 18.
