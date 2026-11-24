---
"@cube-dev/ui-kit": minor
---

`ComboBox` takes the `isIdentifier` flag `TextInput`, `TextArea` and `TagInput` already have, for a combobox whose text is a name, key or other identifier. It sets `autocapitalize="none"`, `autocorrect="off"` and `spellcheck="false"` on the input (its `autocomplete` is already `off`), so a phone keyboard no longer capitalizes or autocorrects the typed text; an explicit `autoComplete` still wins. `TextInputMapper` now passes `isIdentifier` from `keyProps` and `valueProps` to its `combobox` input type too, which used to ignore it.
