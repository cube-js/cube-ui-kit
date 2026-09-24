---
"@cube-dev/ui-kit": patch
---

Fix `Menu` items running their action twice from the keyboard: Enter or Space on a focused item called the menu's `onAction`, and the item's own `onAction`, twice — in a standalone `Menu`, a `Menu.Section`, a `Menu.Trigger` popover and a submenu alike (clicks were unaffected). Enter on a `Menu.SubMenuTrigger` now only opens the submenu, instead of also calling the parent menu's `onAction` with the trigger's key, and a click on a submenu trigger after opening it from the keyboard opens it straight away rather than after the hover delay.
