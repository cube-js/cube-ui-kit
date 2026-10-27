---
"@cube-dev/ui-kit": minor
---

`Escape` and `Tab` follow one rule in every field you type into: they go on to a surrounding dialog, which closes on `Escape` and moves focus on `Tab`, unless the field acts on the key or your `onKeyDown` calls `e.preventDefault()`. A prevented `Escape` or `Tab` stays at the input. Check your handlers: `TextInput`, `TextArea`, `PasswordInput` and `SearchInput` with an `onKeyDown` no longer hold `Escape` and `Tab`, so a handler that acts on `Escape` inside a dialog needs `e.preventDefault()` to keep the dialog open. `ColorInput` and an idle `SearchComboBox` no longer swallow them. In `NumberInput`, `TagInput` and `CommandTextArea` a prevented one no longer reaches the dialog, so a `Tab` that inserts a `CommandTextArea` option keeps focus in the field. `ComboBox` now lets the `Escape` or `Tab` that ends an IME composition in Safari reach the dialog too, like every other field.
