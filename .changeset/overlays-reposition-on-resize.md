---
"@cube-dev/ui-kit": patch
---

An open overlay that changes size now moves to stay on screen, as it does when it opens. Before, it kept the place it opened in: a menu that gained a longer item while open ran past the screen edge, a submenu or popover whose content grew ran past the bottom, a `Select` list squeezed against the edge cut its new option short, and a `DateRangePicker` with `hideTrigger` paged to a six-week month ran off the screen. This covers `MenuTrigger` and its submenus, `DialogTrigger` popovers (and so `Picker`, `FilterPicker`, the date and period pickers, `ColorPicker` and `ColorInput`), `Select` and `DateRangePicker` with `hideTrigger`, on every opening. The lists of `ComboBox`, `SearchComboBox`, `TagInput` and `CommandTextArea` re-place too: a list that opened above its field because it was long moves back below once filtering shortens it.
