---
"@cube-dev/ui-kit": patch
---

Fix tooltips that were accepted but never showed, or showed and vanished. Items inside a `Menu.Section`, and every `CommandMenu` item, no longer get a second tooltip wrapped around their own: the two closed each other, so an object or `tooltip={true}` tooltip flashed and was gone, and the extra wrapper put a `<div>` inside the menu list. An editable `Tab` whose `title` is not a string now shows its `tooltip`. The `Tabs` picker (`showTabPicker`) shows each tab's `tooltip` on its entry. `Button.Split` shows the current action's `tooltip` on the action button, as it already did its `icon` and `label` (`actionProps.tooltip` overrides it). A disabled tooltip no longer opens unseen on hover and swallows `Escape` while the pointer rests on its trigger, which could keep a `Dialog` from closing while the pointer was over an item or tab with actions, or a button radio.
