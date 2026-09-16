---
'@cube-dev/ui-kit': patch
---

Fix interactive controls inside a popover trigger losing their press. `DialogTrigger` only asked a caller's `shouldCloseOnInteractOutside` for presses landing outside every `[data-popover-trigger]`; a control INSIDE the trigger took the "our own trigger, so dismiss" branch without the predicate ever being consulted, and the overlay swallowed the press to close itself. `Select` had the same gap in its own `useOverlay` predicate. As a result the `Picker` and `FilterPicker` clear buttons did nothing when pressed while their list was open — the first press only closed the list — and the same would have applied to custom trigger `actions`.
