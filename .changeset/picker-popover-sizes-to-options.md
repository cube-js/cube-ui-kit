---
'@cube-dev/ui-kit': patch
---

Picker popovers now size to their options: `Picker`, `FilterPicker` (list and tree mode), `ComboBox`, `SearchComboBox`, `TagInput` and `CommandTextArea` show long option labels and descriptions in full, however long the list. A popover is never narrower than its trigger or `30x`, and never wider than half the viewport, or the viewport less a margin on a narrow screen, where it was held at `30x` before. It no longer narrows while open, as the list scrolls or a search filters it. `ComboBox`, `SearchComboBox` and `TagInput` popovers now keep the `30x` floor too. A popover with an explicit `width` in `popoverStyles` or `overlayStyles` is unchanged.
