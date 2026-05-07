---
'@cube-dev/ui-kit': patch
---

Sub-element pseudo selectors now use Tasty’s `$::…` form (e.g. placeholders, track fill `::before`) so styles resolve reliably on `TextInput`, `CommandMenu` search input, and `Slider`.
