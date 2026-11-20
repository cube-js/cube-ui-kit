---
"@cube-dev/ui-kit": minor
---

`NumberInput` takes `isInteger` for whole-number fields. A phone shows its digit keyboard (an iPhone with a `minValue` of 0 or more), and a typed or pasted fraction stays as typed and marks the field invalid with a translated "Enter a whole number.", which also stops a Form from submitting it. A field's own `{ type: 'integer', message }` rule replaces that text with its message. Use it instead of `formatOptions={{ maximumFractionDigits: 0 }}`, which drops a typed decimal separator, so `1000.50` became `100050`. `useFieldProps` takes a `controlRules` param for a custom control's own form rules, which run ahead of the caller's.
