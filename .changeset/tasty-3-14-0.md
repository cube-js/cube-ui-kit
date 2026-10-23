---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.14.0 (from 3.13.0). Components that pass their props through `filterBaseProps` (`Block`, `Flex`, `Text`, `Card`, `Action` and others) now apply a consumer's `tokens` instead of dropping them, render a Tasty `theme` as `data-theme`, and render `isChecked` as `data-checked`. `Alert`'s own `theme` prop, its status theme, still renders only through `data-type`. Sub-elements created by `elements` also accept `theme` now.
