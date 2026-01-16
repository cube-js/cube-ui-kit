---
"@cube-dev/ui-kit": patch
---

Fix ListBox item styles not being applied when passed via `<ListBox.Item styles={...}>`. Item-level styles are now properly merged with parent styles using `mergeStyles`.
