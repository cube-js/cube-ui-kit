---
'@cube-dev/ui-kit': patch
---

Improve `FilterPicker` performance: fewer redundant re-renders, memoized label and key lookups, trigger width measured only when the popover opens, and a controlled popover state so the trigger subtree reconciles normally.
