---
"@cube-dev/ui-kit": patch
---

A popover opened from inside a modern `DialogForm` (one given a `form` controller), such as a `Picker` or `FilterPicker` listbox or a menu, now closes on a click elsewhere in the dialog, instead of staying open until a click outside it. The form now opts out of popover dismissal for presses only, through the new `data-popover-keep-on-press` attribute, which `Button` and `ItemButton` honour like `data-popover-keep` without making a click in the subtree count as inside other popovers.
