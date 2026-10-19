---
"@cube-dev/ui-kit": patch
---

`TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput`: `loadingIndicator` is now rendered in place of the default loading icon while `isLoading` is set. It was accepted and never shown.

`TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput`: `inputProps` values for `disabled`, `maxLength`, `minLength` and `autoFocus`, and `rows` on a `multiLine` `TextInput`, are no longer overwritten by the matching explicit props when those are unset. An explicit prop that is set still wins.

`TextInput`, `TextArea`, `PasswordInput`, `NumberInput`: errors from `validate` now show the invalid style and the message after the user edits or leaves the field, so an empty field does not open in red. `aria-invalid` still follows `validate` from the start, an explicit `isInvalid` still shows at once, and an explicit `errorMessage` still replaces the returned message.

`TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput` and the other fields that share their input box: a press inside the field box but outside the input, such as on the prefix, an icon or a textarea's margins, now focuses the input. Presses on buttons inside the field still go to those buttons.

`TextInput`: `multiLine` no longer puts input-only attributes such as `type="text"` on the textarea.

`SearchInput`: `onClear` is now called when `Escape` clears the text, not only from the clear button. `Escape` keeps clearing whether or not `isClearable` is set.

`SearchInput`: `isInvalid` now sets `aria-invalid` on the input.

`SearchInput`: a caller's `inputRef` no longer detaches the field's own ref, so the clear button returns focus to the input again.

`PasswordInput`: the show/hide toggle is now named "Show password" and reports whether the password is visible with `aria-pressed`. It was named "Toggle masking" in both states.

`TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput`, `RadioGroup`, `CheckboxGroup`, `TagInput`, `CommandTextArea`: `value={null}` now clears a controlled field and keeps it controlled, and so does `isSelected={null}` on `Checkbox` and `Switch`. It used to switch the field to uncontrolled mode, which kept the last value on screen.

`NumberInput`: `wrapperProps` now reach the field wrapper, merged with the props React Aria puts there. They were dropped.

`NumberInput`: the stepper buttons now use the UI Kit translations. The English names stay "Increase {label}" and "Decrease {label}", or "Increase" and "Decrease" when the label is not text, and other locales now follow the UI Kit's own strings.

`NumberInput`: pressing a stepper no longer closes a popover the field sits in.

`CheckboxGroup`: style props and `styles` now apply to the group. They were accepted and ignored.
