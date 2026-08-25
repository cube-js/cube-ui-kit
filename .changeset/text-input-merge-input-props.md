---
'@cube-dev/ui-kit': patch
---

Fix `inputProps` on `TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput` and `CommandTextArea`. Each of these passes its own React Aria props down under the same `inputProps` name as the caller's, and one side was overwriting the other wholesale: `TextInput`, `TextArea`, `NumberInput` and `CommandTextArea` dropped the caller's `inputProps` entirely, while `PasswordInput` and `SearchInput` did the opposite and replaced the hook's value tracking, ids and ARIA attributes with it. The two are now merged, so a key you set wins and event handlers are chained rather than replaced.
