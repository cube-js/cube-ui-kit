---
"@cube-dev/ui-kit": patch
---

A press on a popup that is closing no longer closes the Dialog underneath and loses what was typed in it. A list closes on its own when the content around its trigger scrolls, so a trackpad's momentum was enough for a click on a still-visible option to dismiss the whole Dialog; a second click on a nested Dialog that was already closing did the same. The press now reaches the popup instead, so the option clicked in a fading list is picked, and an `Escape` pressed while a nested modal or tray is still closing reaches the Dialog under it instead of being lost. This covers `Select`, `ComboBox`, `Picker`, `FilterPicker`, menus and every other popover, modal and tray. Pressing an action on a toast or notification while a Dialog is open now runs it too, instead of closing the Dialog and dropping the press. `DisplayTransition`'s render prop also receives `isExiting`: `true` from the render where the `isShown` prop turns `false` until the exit finishes.
