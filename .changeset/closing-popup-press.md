---
"@cube-dev/ui-kit": patch
---

A press on a popup that is closing no longer closes the Dialog underneath and loses what was typed in it. A list closes on its own when the content around its trigger scrolls, so a trackpad's momentum was enough for a click on a still-visible option to dismiss the whole Dialog; a second click on a nested Dialog that was already closing did the same. The press now reaches the popup instead, so the option clicked in a fading list is picked. This covers `Select`, `ComboBox`, `Picker`, `FilterPicker`, menus and every other popover, modal and tray. `DisplayTransition`'s render prop also receives `isExiting`: `true` from the render where `isShown` turns `false` until the content unmounts.
