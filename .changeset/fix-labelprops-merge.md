---
"@cube-dev/ui-kit": patch
---

Fix `labelProps` being overridden in input and field components. User-provided `labelProps` are now properly merged with aria-generated label properties in TextInput, NumberInput, PasswordInput, TextArea, SearchInput, Slider, RangeSlider, and TimeInput components, allowing customization like `labelProps={{ size: 'small' }}`.

