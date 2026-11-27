---
'@cube-dev/ui-kit': patch
---

`ListBox`, `FilterListBox` and `FilterPicker`: a list that loads more options as it is scrolled (`onLoadMore`) now stays where the viewer scrolled when a page arrives. Before, when the focused option was one of the longest the list keeps rendered for its width (the first option, when every label is as long), each new page scrolled the list back to it. New items no longer scroll to the focused option; moving focus with the keyboard still does.
