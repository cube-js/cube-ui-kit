---
"@cube-dev/ui-kit": minor
---

`Item` takes `wrapDescription`: a long description wraps onto more lines instead of ending in an ellipsis. It works on every item that spreads `Item` props, such as `ListBox.Item`, `Select.Item`, `ComboBox.Item`, `FilterPicker.Item` and `Menu.Item`, so a list can show a sentence-long description or a disabled option's reason in full. It defaults to `true` for `type="card"` and `type="header"`, which wrapped before and still do, and `false` otherwise; a card can now pass `false` to keep its description on one line. It replaces a `Description: { whiteSpace: 'normal' }` override, which `tasty/no-protected-restyle` reports.
