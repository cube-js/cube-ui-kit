---
'@cube-dev/ui-kit': patch
---

`ComboBox` and `SearchComboBox` now skip their built-in key handling for a key whose `onKeyDown` handler calls `e.preventDefault()`, matching `TagInput` and `CommandTextArea`. A prevented `ArrowDown` no longer opens the popover, and a prevented `Enter` no longer selects an option, commits a custom value or calls `onSubmit`. A handler that called `preventDefault()` but still relied on the built-in handling for that key needs to drop the call.

`TextInput`, `TextArea`, `PasswordInput` and `NumberInput` now declare `onKeyDown` and `onKeyUp` in their own prop types, with the same signature as React Aria's keyboard handlers.
