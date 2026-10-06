---
"@cube-dev/ui-kit": patch
---

`Item`'s auto tooltip now covers a truncated `description`, not only the label. Hovering the row shows the text that is cut off — the description, the label, or both, with the description below the label in a lighter `t4n` style. A row whose label truncates while its description fits shows the same tooltip as before. Components built on `Item` (`ItemButton`, `ListBox` and `Menu` options, `Select` and `Picker` triggers) get the same behavior. `Tooltip` gains a `Description` sub-element for that secondary line, which `tooltipStyles` can override. Pass `tooltip={false}` to turn it off.
