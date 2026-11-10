---
'@cube-dev/ui-kit': patch
---

UI Kit runs on Tasty 3.18.0 (`@tenphi/tasty`). A state alias, global or local to a component's styles, can now use other aliases in its expression, such as `'@compact': '@mobile & !expanded'`; before, Tasty dropped such an alias with a warning. A circular alias never matches and warns with `CIRCULAR_STATE_ALIAS`.
