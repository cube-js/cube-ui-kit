---
"@cube-dev/ui-kit": patch
---

Fix tests on jsdom before 27 failing since 0.187.0 whenever a `ListBox` was on the page, including inside `Select`, `ComboBox`, `SearchComboBox`, `Picker`, `FilterPicker`, `FilterListBox`, `TagInput` and `CommandTextArea`. Every `getComputedStyle` call threw `Cannot read properties of null (reading 'children')`, which broke role queries, `toBeVisible` and user-event clicks. Options no longer use a `:has(~ …)` selector, and their spacing is unchanged.
