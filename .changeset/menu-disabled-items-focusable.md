---
'@cube-dev/ui-kit': patch
---

`Menu`, `CommandMenu`: the arrow keys, Home/End and typeahead now stop on a disabled item instead of skipping it, as in the WAI-ARIA menu pattern, so a keyboard or screen reader user hears its label, its `description` (put the reason there) and that it is disabled. The item stays disabled: dimmed, `aria-disabled`, and Enter, Space and a click do nothing and leave the menu open. This also covers a disabled icon-only `Menu.Item.Action` and every menu built on `Menu`; a `Menu` opened with `autoFocus="first"` can now land on a disabled first item. `CommandMenu` still highlights the first match that can run as you type. Tests that expected the skip need updating.
