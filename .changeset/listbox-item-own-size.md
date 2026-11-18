---
"@cube-dev/ui-kit": patch
---

A `ListBox` option takes its item's own `size` over the list's, for that row only: `<ListBox.Item size="6x">` gives a row tall enough for an avatar beside a name. This covers `ComboBox`, `FilterPicker` and `FilterListBox`, which render their options through `ListBox`; `Select` already did it. The list used to override every item's `size`, so a `size` an item passed without effect now applies: check rows that set one. A named size also keeps the virtualized list's height estimate right.
