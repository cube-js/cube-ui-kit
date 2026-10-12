---
"@cube-dev/ui-kit": patch
---

Let `Tab` and `Shift+Tab` wrap inside a Dialog from a `FilterPicker` or `Picker` trigger. Their key handler stopped `Tab` along with every other key except `Escape`, so the Dialog's focus containment never saw it, and focus stayed on a trigger placed first or last instead of wrapping to the other end. `ListBox` and a `Tree` row checkbox shared the handler and now release `Tab` too; `Enter`, arrow keys and typeahead stay contained.
