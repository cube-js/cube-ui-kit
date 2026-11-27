---
'@cube-dev/ui-kit': minor
---

`ComboBox` takes an `emptyLabel` for a status that isn't an option, such as "No matches" or "Searching…". With it set, a list with no options stays open and shows the label instead of closing: typed text that matches nothing, no items, or a load with none yet. The label is not an option, so the arrow keys skip it and `Enter` never picks it, and it describes the empty listbox for screen readers. While `isLoading`, a list that opens empty shows the label after a second, and a list already on screen stays through the load. Switch the label's text on `isLoading` to say the list is loading. Without `emptyLabel`, `ComboBox` behaves as before. Use it instead of a disabled option that stands in for a status, which the arrow keys now reach and screen readers announce as an unavailable choice.
