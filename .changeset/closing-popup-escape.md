---
"@cube-dev/ui-kit": patch
---

Close a Dialog on the first `Escape` after a list inside it was used. Three separate swallows each kept it open: a popup that had already closed still claimed the key through `useOverlay`, focus was left on an option that detached before the key was dispatched, and the trigger's tooltip took it from a document-level listener once focus returned. Tooltips no longer open when a component hands focus back rather than the user arriving, and `ListBox`, `Picker` and `FilterPicker` no longer stop `Escape` propagating out of keyboard handlers that never used it.
