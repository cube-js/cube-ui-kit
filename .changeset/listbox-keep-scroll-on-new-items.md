---
'@cube-dev/ui-kit': patch
---

`ListBox`, `FilterListBox` and `FilterPicker`: a list that loads more options as it is scrolled (`onLoadMore`) now stays where the viewer scrolled when a page is appended to its options. Before, when the focused option was still rendered, each new page scrolled the list back to it: a list keeps its longest options rendered for its width (the first ones, when every label is the same length), and a list with sections, such as a search with `allowsCustomValue`, renders them all. Moving focus with the keyboard, or a narrower search, still scrolls to the focused option, and a list that loads no pages scrolls as before.
