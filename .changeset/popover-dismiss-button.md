---
'@cube-dev/ui-kit': patch
---

**Popover dismiss for plain Button / ItemButton**: a single click on a `Button` or `ItemButton` rendered outside an open popover now closes the popover AND fires the button's `onPress` in the same click. Previously the first click was always swallowed by `useOverlay`'s `shouldCloseOnInteractOutside` (which `stopPropagation`s outside clicks), so users had to click twice.

- `Button` and `ItemButton` now mark their root with `data-popover-dismiss`.
- `MenuTrigger`, `Select`, `ComboBox`, `FilterPicker`, and `Picker` recognize `[data-popover-dismiss]` outside-click targets and schedule their close via `setTimeout(0)` so the close lands AFTER the click event finishes (i.e. after the button's `onPress` runs). The predicate returns `false` so the click is not stopped.

`Button`/`ItemButton` used as a popover trigger (wrapped by `PressResponder`/`MenuTrigger`) keep their existing trigger behaviour — the trigger branch matches first, the dismiss branch is never reached.
