---
"@cube-dev/ui-kit": patch
---

Fix `ComboBox` without `allowsCustomValue` ignoring the typed text on `Enter` while the list is closed, as after `Escape` or with `popoverTrigger="manual"`. `Enter` now settles the text the way leaving the input does before a surrounding form submits: it selects the option the text names exactly, or the only one it matches, unless that option is disabled, and otherwise shows the selection again (or clears it with `clearOnBlur`). Before, the form submitted the old value, or none, while the input still showed the typed text. `Enter` and leaving the input now match the text against every option, so after the arrow keys or the chevron open the list with every option on text that matches none, leaving the input no longer selects a lone option the text doesn't match, and `Enter` clears the selection as for any text that matches nothing.
