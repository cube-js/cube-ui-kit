---
"@cube-dev/ui-kit": minor
---

`TextInput`, `TextArea` and `TagInput` take an `isIdentifier` flag for a field that holds a name, key, token or attribute name. It sets `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"` and `autocomplete="off"` on the input, so a phone keyboard no longer capitalizes or autocorrects the value and the browser offers no past entries; an explicit `autoComplete`, `autoCorrect` or `spellCheck` prop, or the same attribute in `inputProps`, still wins. `TextInputMapper` takes it in `keyProps` and `valueProps` for its `input` and `textarea` input types. iOS still offers contact AutoFill on such a field: no attribute turns that off.
