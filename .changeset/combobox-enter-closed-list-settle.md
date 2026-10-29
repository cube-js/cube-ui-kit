---
"@cube-dev/ui-kit": patch
---

Fix `ComboBox` without `allowsCustomValue` ignoring the typed text on `Enter` while the list is closed, as after `Escape` or with `popoverTrigger="manual"`. `Enter` now settles the text the way leaving the input does before a surrounding form submits: it selects the option the text names exactly, or the only one it matches, unless that option is disabled, and otherwise shows the selection again (or clears it with `clearOnBlur`). Before, the form submitted the old value, or none, while the input still showed the typed text.
