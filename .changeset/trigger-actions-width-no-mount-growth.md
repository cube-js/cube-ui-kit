---
"@cube-dev/ui-kit": patch
---

Fix `Select`, `Picker`, `FilterPicker` and `ItemButton` triggers, and tabs with actions, growing by the width of their actions run right after mounting. The row reserves that width from a measurement, and the first measurement animated in from 0px, so a trigger widened by its caret over the first 80ms. `FilterPicker` and `Picker` size their popover from the trigger when it opens, so a popover opened in that window came out narrower than the trigger, by a different amount each time. The first measured width now applies at once. Actions revealed on hover still slide in.
