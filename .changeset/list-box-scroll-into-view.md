---
"@cube-dev/ui-kit": patch
---

A virtualized `ListBox` scrolls an option it hasn't rendered yet wholly into view. Moving to it from a search input, as End does in `FilterPicker` and `FilterListBox`, stopped short by the list's top margin and left the last option clipped.
