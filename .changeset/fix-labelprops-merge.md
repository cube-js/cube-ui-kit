---
"@cube-dev/ui-kit": patch
---

Fix `labelProps` being overridden in input components. User-provided `labelProps` are now properly merged with aria-generated label properties in TextInput, NumberInput, PasswordInput, TextArea, and SearchInput components, allowing customization like `labelProps={{ size: 'small' }}`.

