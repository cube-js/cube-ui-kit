---
"@cube-dev/ui-kit": minor
---

The search inputs of `SearchInput`, `SearchComboBox`, `FilterListBox`, `FilterPicker` (list and tree) and `CommandMenu` set `enterkeyhint="search"`, `autocapitalize="none"`, `autocorrect="off"` and `spellcheck="false"`, so a phone keyboard shows a Search key and neither capitalizes nor corrects a query. To change any of them, `SearchInput` takes the prop or `inputProps` as before, `SearchComboBox` takes a new `inputProps`, and `FilterListBox`, `FilterPicker` and `CommandMenu` take a new `searchInputProps`.
