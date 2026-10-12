---
"@cube-dev/ui-kit": patch
---

Let `Tab` and `Shift+Tab` wrap inside a Dialog from a `FilterPicker` or `Picker` trigger: focus on a trigger placed first or last used to stay put instead of moving to the other end. `Tab` from a `ListBox` inside a Dialog wraps the same way, and `Tab` from a `Tree` row checkbox now leaves the tree, as it does from a row. `Enter`, arrow keys and typeahead still stay with the control, and `Escape` still closes an open popup before the Dialog.
