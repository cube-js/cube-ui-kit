---
"@cube-dev/ui-kit": patch
---

`TagInput`: the chips grid, the show-options and clear buttons, and the options listbox are now named after the field when it is named by `aria-label` or `aria-labelledby` instead of a visible `label`. With `aria-labelledby` they read the same elements ("Selected values" followed by the field's name, and the listbox the name alone, no longer "Options"); with only `aria-label` its text is joined in, such as "Selected values, Region". Fields without a visible label, such as one per table row, no longer all expose the same generic names.
