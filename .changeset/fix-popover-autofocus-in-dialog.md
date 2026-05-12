---
"@cube-dev/ui-kit": patch
---

Fix focus management for popover-based components (`Menu`, `Select`, `FilterPicker`, `Picker`) opening inside a contained `Dialog`.

Previously, when a popover-based component opened inside an outer popover/modal `Dialog` (whose `FocusScope` contains focus), focus would land on the popover `<section>` itself or stay on the trigger button instead of moving to the appropriate element inside the popover (search input, first option, first menu item).

Three independent fixes:

- **`Dialog`** — now re-promotes focus to a priority element (`input[data-autofocus]`, `button[type="submit"]`, `button[data-type="primary"]`) when the dialog `<section>` itself is the active element. This recovers from a race between React's native `autoFocus` (mutation phase) and react-aria's focus-scope tree registration (layout phase). Fixes `FilterPicker`/`Picker` search inputs.
- **`Menu` (`MenuTrigger`)** — its popover content is now wrapped in a `<FocusScope restoreFocus>` so the menu items register as a child scope of any outer contained `FocusScope`. Without this, the outer scope rejects focus moving into the menu items (in a portal, with no registered child scope) and yanks focus back to the menu trigger.
- **`Select`** — its inner `<FocusScope>` now also has `autoFocus`. Select's listbox subtree is mounted unconditionally, so react-aria's `useSelectableCollection` autoFocus is consumed once on mount when the listbox isn't yet in the DOM. The `FocusScope` `autoFocus` runs each time the popover opens (the inner tree unmounts between opens) and explicitly focuses the listbox.
