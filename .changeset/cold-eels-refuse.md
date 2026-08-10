---
'@cube-dev/ui-kit': patch
---

Fixed `Picker` and `FilterPicker` with `disallowEmptySelection` in single selection mode: re-selecting the already-selected item (by click or Enter) now closes the popover without firing `onSelectionChange`, matching the react-aria Select behavior. Previously the popover stayed open and no event fired at all.

Without `disallowEmptySelection` the behavior is unchanged: re-selecting the current item still deselects it and fires `onSelectionChange(null)`.

`ListBox` and `FilterListBox` now expose the `allowDuplicateSelectionEvents` prop (React Stately pass-through) that the fix is built on.
