---
"@cube-dev/ui-kit": patch
---

A `Title` inside a `Dialog` is now the `h2` the dialog asks for rather than an `h1`, unless it sets its own `level`; it looks the same. `Menu` keeps its id and accessible name on the menu list only, so a trigger's `aria-controls` no longer finds a wrapper with the same id. `CommandMenu` names its search input with its `aria-label`, and its `aria-activedescendant` now points at the highlighted command rather than at an id no element has; item ids are unique to each menu.
