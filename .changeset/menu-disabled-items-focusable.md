---
'@cube-dev/ui-kit': patch
---

`Menu`, `CommandMenu`: keyboard navigation now stops on a disabled item instead of skipping it, as in the WAI-ARIA menu pattern, so a keyboard or screen reader user hears its label, its `description` (put the reason there) and that it is disabled. In `Menu` that holds for the arrow keys, Home/End and typeahead, in every menu built on it, and for a disabled icon-only `Menu.Item.Action`; a `Menu` opened with `autoFocus="first"` can now land on a disabled first item. In `CommandMenu` the arrow keys reach it, and typing still highlights the first match that can run. The item stays disabled: dimmed, `aria-disabled`, and Enter, Space and a click do nothing and leave the menu open. Tests that expected the skip need updating.
