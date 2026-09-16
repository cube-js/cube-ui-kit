---
'@cube-dev/ui-kit': minor
---

Add an `actions` prop to `Select`, `Picker` and `FilterPicker` for custom actions inside the trigger, rendered to the left of the built-in clear button and dropdown caret. Pressing one runs its handler without opening or closing the popover — including while the popover is open — so an action can do what the clear button cannot, such as restoring a default selection. Each component re-exports `ItemAction` as `.Action` (`Picker.Action`, `Select.Action`, `FilterPicker.Action`) so actions inherit the trigger's size and theme, and `Tab.Action` is exposed for the same reason on a tab's `actions` slot.
