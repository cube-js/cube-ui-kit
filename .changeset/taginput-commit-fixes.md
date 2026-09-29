---
"@cube-dev/ui-kit": patch
---

`TagInput` adds exactly the option that is clicked or picked with the arrow keys, even when an earlier option has the same label in another case. Typed text now matches an option by its key, then by its exact label anywhere in the list, before a case- or accent-insensitive match counts. With `allowsCustomValue`, text that matches an option only in another case is added as typed (`paris` stays `paris` next to an option `Paris`), and its own row is the one Enter picks; without it, `production` still picks `Production`.

`TagInput` no longer puts refused duplicates back into the input: the value is already a chip, and the message says so. With `delimiters={[]}`, several refused values from one paste are no longer glued into one line that leaving the field would add as a single value; only the first stays in the input, with its message.

`TagInput`, `ComboBox`, `SearchComboBox` and `CommandTextArea` report focus and blur as focus moves instead of a frame later. Leaving a `TagInput` commits the typed text before the click that moved focus is handled, so a Save button, a fast tap or a Playwright `click()` no longer submits a form without it, and a consumer `onFocus` runs before a change made in the same press rather than undoing what that change did.
