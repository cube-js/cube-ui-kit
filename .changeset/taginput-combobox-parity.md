---
'@cube-dev/ui-kit': minor
---

**TagInput:** the suggestions popover now opens and closes like `ComboBox`'s. A press in the input opens it, also when the input already has focus, as after `Escape` closed it. A press on the box around the input counts too, with `tagPlacement="inside"` as well, but a press on a chip or a button does not, and a click on the label only focuses the input. Typed text that matches no option keeps the popover closed on a press, and `popoverTrigger="manual"` still opens it only from the chevron and the arrow keys. When no option matches the typed text, the popover stays open and says "No results found" instead of disappearing; the new `emptyLabel` prop replaces the words. With `isLoading`, the popover says "Loading…" while there is no option to show, and the chevron takes the `loading` modifier. With `popoverTrigger="focus"`, the chevron now closes the popover: handing focus back to the input used to open it again.
