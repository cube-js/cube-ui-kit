---
'@cube-dev/ui-kit': minor
---

`ComboBox` and `SearchComboBox` now skip their built-in key handling for a key whose `onKeyDown` handler calls `e.preventDefault()`, matching `TagInput` and `CommandTextArea`. A prevented `ArrowDown` no longer opens the popover, and a prevented `Enter` no longer selects an option, commits a custom value or calls `onSubmit`. A handler that called `preventDefault()` but still relied on the built-in handling for that key needs to drop the call.

This changes one common pattern. On a `ComboBox` with `allowsCustomValue` inside a form, `onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}` used to stop the form submit while `Enter` still committed the typed value. It now stops both, and the value is committed only on blur. To keep committing on `Enter`, commit it in the handler: control `selectedKey` and call `setSelectedKey(e.currentTarget.value.trim() || null)` after `e.preventDefault()`.

`onKeyDown` on `ComboBox` and `SearchComboBox` is now typed with React Aria's keyboard event, the one it always received at runtime, so `e.continuePropagation()` type-checks. A handler annotated with React's `KeyboardEvent` still type-checks, but code that calls the prop itself (a wrapper forwarding a native `<input>` event to it) must now pass React Aria's event.

`TextInput`, `TextArea`, `PasswordInput` and `NumberInput` now declare `onKeyDown` and `onKeyUp` in their own prop types, with the same signature as React Aria's keyboard handlers.
