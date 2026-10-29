---
"@cube-dev/ui-kit": minor
---

`TextInput`, `SearchInput`, `PasswordInput`, `NumberInput`, `TextArea` and `CommandTextArea` take `shape="plain"`: a square field box with no border at rest, for a field set flush in a container that draws its edges, such as a toolbar or a panel header. Its border keeps its width, so nothing shifts, and shows in the default field's colours on focus, in a valid or invalid state and in high contrast. `NumberInput`'s step buttons square their corners with it. Use it in place of `styles={{ border: false, radius: false }}`, which also hid the focus border. The default, `shape="default"`, is unchanged.
