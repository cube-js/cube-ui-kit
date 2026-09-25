---
"@cube-dev/ui-kit": patch
---

Fix the caret of a `Select`, `Picker` or `FilterPicker` trigger not opening the dropdown. The trigger keeps an empty placeholder under its actions run to reserve that run's width, and the placeholder stopped every press that reached it. Once the run had been measured it sat right under the caret, so a press there only closed an open dropdown and never opened a closed one. The placeholder now lets presses through; real actions still keep a press on them from pressing the row. The same dead zone covered the padding and gaps of any `ItemButton`'s actions run.
