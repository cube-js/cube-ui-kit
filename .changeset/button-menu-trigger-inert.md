---
"@cube-dev/ui-kit": patch
---

A disabled or loading `Button` that has a tooltip, or renders as a link, no longer opens its `MenuTrigger` menu from the keyboard (Enter, Space or ArrowDown), as `ItemButton` and `ItemAction` already did not. Enter or Space on such a `Button`, `ItemButton` or `ItemAction` also no longer clicks the element around it, so a clickable row or card doesn't react.
