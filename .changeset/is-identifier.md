---
"@cube-dev/ui-kit": minor
---

`TextInput`, `TextArea` and `TagInput` take an `isIdentifier` flag for a field that holds a name, key, token or attribute name. It sets `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"` and `autocomplete="off"` on the input, so a phone keyboard no longer capitalizes or autocorrects the value and the browser offers no past entries; on `TextInput` and `TextArea` an explicit `autoComplete`, `autoCorrect` or `spellCheck` prop, or any of the four attributes in `inputProps`, still wins, and on `TagInput` an explicit `autoComplete`. `TextInputMapper` takes it in `keyProps` and `valueProps` for its `input` and `textarea` input types. iOS still offers contact AutoFill on such a field: no attribute turns that off.
