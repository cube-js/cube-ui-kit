---
'@cube-dev/ui-kit': patch
---

Picker popovers now size to their options: `Picker`, `FilterPicker` (list and tree mode), `ComboBox`, `SearchComboBox`, `TagInput` and `CommandTextArea` show long option labels and descriptions in full, however long the list. A popover is never narrower than its trigger (a picker's, at least `30x`) or its field, and never wider than half the viewport or `60x`, whichever is larger, nor than the viewport less a margin, so a phone's popover is no longer held at `30x`. It no longer narrows while open, as the list scrolls or a search filters it. A popover with an explicit `width` in `popoverStyles` or `overlayStyles` is unchanged. Outside a popover too, a `ListBox` or `FilterListBox` sized to its content is now as wide as its longest options and never narrows while mounted, and a `Tree` is as wide as its longest rows; one with a set width keeps it.
