---
"@cube-dev/ui-kit": patch
---

A reorderable `ListBox` keeps the `id` and `aria-describedby` you pass it, along with its description and error message. Drag-and-drop had replaced the list's id with one of its own and cleared its description. The search input of a reorderable `FilterListBox` or `FilterPicker` now points `aria-controls` at its list, which it missed while the search was empty.
