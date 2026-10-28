---
"@cube-dev/ui-kit": minor
---

`TextInput`, `NumberInput`, `PasswordInput`, `SearchInput`, `TextArea` and `CommandTextArea` take a `tooltip` of their own, as `Checkbox` and `Switch` do: a string, or `TooltipProvider` props. It is anchored to the field box, opens on hover over it and on keyboard focus, closes on any key, and describes the input. A first `Escape` only closes it, so it doesn't clear a `SearchInput` or close a dialog. A disabled input with a `tooltip` stays focusable so the keyboard reaches it too: it is `aria-disabled` and read-only instead of natively disabled, takes no text, doesn't step, and a click on it or on its label doesn't focus it. Not being natively disabled, its value is part of a plain `<form>`'s submitted data; ui-kit's `Form` is not affected. `tooltip` was the old name of `labelTooltip`, so a caller still passing it for the label badge now gets an input tooltip and no migration warning: rename it to `labelTooltip`.
