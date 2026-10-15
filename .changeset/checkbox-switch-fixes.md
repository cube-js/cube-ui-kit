---
"@cube-dev/ui-kit": patch
---

`Checkbox` and `Switch` fixes. A standalone `Checkbox` now gets the `hovered` mod, and a grouped one now puts its state mods (`checked`, `disabled`, `invalid`, `hovered`, …) on its wrapper, so `styles` keyed on them work in both. A string `label` no longer replaces the inline text or your `aria-label` in a `Checkbox`'s accessible name: `<Checkbox label="Notifications">Send me emails</Checkbox>` is named "Notifications Send me emails", as a `Switch` already was. A `Checkbox` in a group no longer copies its `id`, `aria-*` and `data-*` props onto its wrapper, so `#id`, `<label for>` and `aria-labelledby` reach the input; both a standalone and a grouped one now pass `className`, `style`, `qaVal` and your own `mods` to the wrapper. A `Switch` label now wraps instead of staying on one line. A `Checkbox` or `Switch` named only by a field `label` no longer logs React Aria's missing `aria-label` warning.
