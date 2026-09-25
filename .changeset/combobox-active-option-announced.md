---
"@cube-dev/ui-kit": patch
---

Screen readers now announce the focused option while arrowing through `ComboBox`, `SearchComboBox`, `CommandTextArea` and `FilterListBox` options: `aria-activedescendant` pointed at an id no option had, and in `ComboBox` and `FilterListBox` it also stopped following the arrow keys. `FilterListBox`'s search input now names its list with `aria-controls`.
