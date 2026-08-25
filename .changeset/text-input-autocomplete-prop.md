---
'@cube-dev/ui-kit': minor
---

Add a proper `autoComplete` prop to the text-input family. `TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput`, `CommandTextArea` and `TextInputMapper` (through `keyProps` / `valueProps`) now accept `autoComplete` in the standard React casing, and `InlineInput` gained the prop as well. The lowercase `autocomplete` prop still works as a deprecated alias; `autoComplete` wins when both are set.

Previously the camelCase prop — the one React Aria's own types advertise — was silently dropped, and the attribute was written unconditionally after `inputProps` was merged, so it also overwrote an `autoComplete` coming from `inputProps` or from a React Aria hook with `undefined`. As a result `NumberInput` now renders the `autocomplete="off"` that `useNumberField` asks for.
