---
"@cube-dev/ui-kit": patch
---

A reorderable `ListBox` keeps the `id` and `aria-describedby` you pass it, along with its description and error message, and the search input of a reorderable `FilterListBox` or `FilterPicker` now points `aria-controls` at its list. Drag-and-drop had replaced the list's id with one of its own and cleared its description (in `FilterListBox` and `FilterPicker`, while the search was empty).
