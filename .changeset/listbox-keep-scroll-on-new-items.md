---
'@cube-dev/ui-kit': patch
---

`ListBox`, and `FilterListBox`, `FilterPicker` and `Picker` with it: a list that loads more options as it is scrolled (`onLoadMore`) now stays where the viewer scrolled when a page arrives. Before, when the focused option was one of the longest, which the list keeps rendered for its width (the first option, when every label is the same length), each new page scrolled the list back to it. Options appended after the focused one no longer scroll to it; moving focus with the keyboard, or a search that keeps the focused option, still does.
