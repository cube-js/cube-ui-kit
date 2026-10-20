---
"@cube-dev/ui-kit": patch
---

Fix focus dropping to the page when a `hideOnClose` dialog closes: `DialogContainer` and a popover `DialogTrigger` now return focus to the element that opened them, as they do without `hideOnClose`.
