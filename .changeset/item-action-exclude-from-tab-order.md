---
"@cube-dev/ui-kit": patch
---

`ItemAction`: `excludeFromTabOrder` now takes the action out of the Tab order. The action used to reset it, so `SearchInput`'s clear button and other field actions that ask to stay pointer-only were Tab stops. An explicit `tabIndex` still wins.
