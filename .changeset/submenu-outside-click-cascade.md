---
'@cube-dev/ui-kit': patch
---

**Menu sub-menus**: a single outside click now closes the entire menu hierarchy. Previously, with one or more nested `Menu.SubMenuTrigger`s open, only the deepest sub-menu closed on the first outside click — the parent menu and intermediate sub-menus stayed open until additional clicks. React Aria's `useOverlay` invokes `onClose` only for the topmost overlay in its `visibleOverlays` stack, so the fix lives in `SubMenuTrigger`: the nested `Popover` now receives a `shouldCloseOnInteractOutside` predicate (mirroring `MenuTrigger`'s) that schedules the parent's `onClose` via `setTimeout(0)`. The existing `parentContext.isClosing` cascade then collapses every level. `usePopoverSync`'s peer-coordination semantics (closing siblings when one popover opens) are unchanged. Existing close paths — Escape, `DismissButton`, item selection — are untouched and continue to behave as before.
