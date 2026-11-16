---
'@cube-dev/ui-kit': minor
---

**TagInput:** the `isClearable` button now clears the whole field: the typed text and every chip but the locked ones (`tagProps` with `isDisabled`). It calls `onChange` once with what is left and announces the removed values. It shows while there is text or a chip to clear, not only while there is text, and is named "Clear all" instead of "Clear text"; the `tagInput.clearText` and `tagInput.clearTextFor` locale keys are now `tagInput.clearAll` and `tagInput.clearAllFor`. `Escape` still clears only the typed text.
