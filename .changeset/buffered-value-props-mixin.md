---
'@cube-dev/ui-kit': patch
---

Declare `isBuffered` on the four fields that implement it rather than on the shared
`CubeTextInputBaseProps`.

`TextInput`, `TextArea`, `PasswordInput` and `SearchInput` buffer their value; `NumberInput` and
`CommandTextArea` are built on the same base type but keep their own text and never read the prop.
Declaring it on the base put it in their declared surface too. It now comes from a
`CubeBufferedValueProps` mixin, exported alongside the base props, so a field built on that base in
future doesn't inherit a flag it ignores.

Type-level only — no runtime change, and no behaviour change for the four fields.
