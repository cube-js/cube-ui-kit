---
'@cube-dev/ui-kit': patch
---

**Fix:** A `DialogTrigger type="popover"` no longer swallows the outside click
that opens another popover. Previously, while a popover Dialog was open, a
single click on a sibling popover trigger was consumed and that trigger's
popover would not open. The popover branch now uses the same
`shouldCloseOnInteractOutside` predicate as `Select`, `ComboBox`, and
`MenuTrigger`, letting clicks on other popover triggers (and
`data-popover-dismiss` controls) through so `usePopoverSync` can hand off
between popovers correctly.
