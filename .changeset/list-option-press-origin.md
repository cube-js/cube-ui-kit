---
"@cube-dev/ui-kit": patch
---

`Select`, `ListBox` and the pickers built on it (`FilterListBox`, `FilterPicker`, `Picker`, `ComboBox`): a mouse press on an option now selects the option it started on when the pointer comes up inside that option's original box, even if the list moved in between, as it does while a popover is still animating in or scrolls while closing. The press used to pick the neighbouring option under the pointer, or nothing. A press released elsewhere, or after Escape or another key, selects nothing.
