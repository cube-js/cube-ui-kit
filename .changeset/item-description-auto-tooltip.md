---
"@cube-dev/ui-kit": patch
---

`Item`'s auto tooltip now covers a truncated `description`, not only the label. When either one is cut off, hovering the row shows the full label with the description on the line below — including rows whose label already truncated, which now show their description too. Components built on `Item` (`ItemButton`, `ListBox` and `Menu` options, `Select` and `Picker` triggers) get the same behavior. Pass `tooltip={false}` to turn it off.
