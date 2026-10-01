---
"@cube-dev/ui-kit": patch
---

Fix the options of a virtualized `ListBox` (one without sections that isn't reorderable, including inside `ComboBox`, `SearchComboBox`, `TagInput`, `CommandTextArea`, `Picker`, `FilterPicker` and `FilterListBox`) overlapping for a frame. Options taller than their estimate, such as ones with a wrapped label, overlapped whenever the parent re-rendered with new items or children (even identical ones), or when a re-render made an option taller. A re-render now keeps the measured heights, and options are measured before the browser paints.
