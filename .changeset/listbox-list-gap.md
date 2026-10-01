---
"@cube-dev/ui-kit": minor
---

`ListBox` takes `listGap`, the space between options in pixels. It defaults to the hairline options had before, and spaces flat (virtualized), sectioned and reorderable lists alike: a flat list positions its options itself, so it ignored a margin set through `optionStyles`. `FilterListBox`, `Picker`, `FilterPicker`, `ComboBox`, `SearchComboBox`, `TagInput`, `CommandTextArea` and `Select` pass it to their list; in a sectioned `Select` it spaces the options within each section, while sections, dividers and loose options between them keep their spacing. A reorderable list's drop indicator sits in the middle of the gap. The `.5x` a ListBox keeps below its last option is now the list's bottom padding, so `listStyles={{ padding: 0 }}` removes it, and a `height` set through `listStyles` no longer includes it.
