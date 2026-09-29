---
"@cube-dev/ui-kit": minor
---

`TagInput` adds exactly the option that is clicked or picked with the arrow keys, as its own key. Typed text now names an option by its exact label, then by its key, anywhere in the list, before a case- or accent-insensitive match counts, and Enter, a delimiter, a paste and leaving the field always add the same option for the same text: the option the text names stays listed and focused even when the filter would hide it. With `allowsCustomValue`, text that matches an option only in case or accents is its own value and is added as typed (`paris` stays `paris` next to an option `Paris`); without it, `production` still adds `Production`.

`TagInput` no longer puts a refused duplicate back into the input: the value is already a chip, and the message says so. Escape clears a message even when the input is empty, and leaving the field clears one once nothing is left in the input, so a refused duplicate no longer leaves an empty field marked invalid. With `delimiters={[]}`, several refused values from one paste are no longer glued into one line that leaving the field would add as a single value; only the first stays in the input, with its message.

`TagInput` commits the typed text before the click that takes focus away is handled, so a Save button, a fast tap or a Playwright `click()` no longer submits a form without it. While the suggestions show, a press outside is no longer swallowed by the list: it reaches what was pressed, so a native Save button saves on the first click. `TagInput`, `ComboBox`, `SearchComboBox` and `CommandTextArea` now report focus and blur as focus moves instead of a frame later, so a consumer `onFocus` runs before a change made in the same press rather than undoing what that change did.
