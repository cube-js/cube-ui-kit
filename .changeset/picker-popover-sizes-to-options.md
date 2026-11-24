---
'@cube-dev/ui-kit': patch
---

Picker popovers now size to their options: `Picker`, `FilterPicker` (list and tree mode), `ComboBox`, `SearchComboBox`, `TagInput` and `CommandTextArea` show long option labels and descriptions in full, however long the list. A popover is never narrower than its trigger or `30x`, and never wider than half the viewport or `60x`, whichever is larger, nor than the viewport less a margin, so a phone's popover is no longer held at `30x`. It no longer narrows while open, as the list scrolls or a search filters it. `ComboBox`, `SearchComboBox` and `TagInput` popovers now keep the `30x` floor too. A popover with an explicit `width` in `popoverStyles` or `overlayStyles` is unchanged. Outside a popover too, a `ListBox`, `FilterListBox` or `Tree` sized to its content is now as wide as its longest options and, unless it is a reorderable `ListBox`, never narrows while mounted; one with a set width keeps it.
