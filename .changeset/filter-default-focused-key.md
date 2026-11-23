---
"@cube-dev/ui-kit": minor
---

`FilterPicker` and `FilterListBox` take `defaultFocusedKey`, the option highlighted when the list opens instead of the first selected option. A list that leads with an action row, such as "Create chart" above the charts, names that row so that Enter right after opening runs the action instead of unchecking a selected option. The list also returns to it when a search hides the highlighted option. While it is hidden, disabled or missing, the list highlights the first selected option, else the first, as before. In `FilterPicker` it applies each time the popover opens, and in list mode only.
