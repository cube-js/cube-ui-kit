---
"@cube-dev/ui-kit": patch
---

`RadioGroup` (with `Radio.ButtonGroup` and `Radio.Tabs`), `CheckboxGroup` and `ColorSwatchGroup` now put the caller's `qaVal`, `className`, `style`, `tokens` and `mods` on the group element, as `ToggleGroup` and `Picker` do. A caller's `mods` go over the group's own, and its `tokens` merge with them. `CheckboxGroup` also takes the caller's `qa`.
