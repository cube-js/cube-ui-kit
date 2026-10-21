---
"@cube-dev/ui-kit": patch
---

A reorderable `ListBox` keeps the `id` you pass it, and the search input of a reorderable `FilterListBox` or `FilterPicker` now points `aria-controls` at its list. Drag-and-drop had replaced the list's id with one of its own while the search was empty.
