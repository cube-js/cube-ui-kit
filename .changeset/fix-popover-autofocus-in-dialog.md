---
"@cube-dev/ui-kit": patch
---

Fix auto-focus of priority elements (e.g., `FilterPicker` and `Picker` search inputs) when a popover-based component opens inside a contained `Dialog`.

Previously, focus could land on the popover `<section>` itself instead of the search input. The cause was a race between React's native `autoFocus` (which fires during the mutation phase) and react-aria's focus-scope tree registration (which happens in the layout phase): the outer `Dialog`'s `FocusScope` saw the focus moving to an "unregistered" element and yanked it back, after which `useDialog` defaulted focus to the popover dialog shell.

`Dialog` now re-promotes focus to a priority element (`input[data-autofocus]`, `button[type="submit"]`, `button[data-type="primary"]`) when the dialog `<section>` itself is the active element, recovering from this race.
