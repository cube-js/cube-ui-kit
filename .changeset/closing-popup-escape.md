---
"@cube-dev/ui-kit": patch
---

Close a Dialog on the first `Escape` after a list inside it was used. Several separate swallows each kept it open: a popup that had already closed still claimed the key through `useOverlay`, focus was left on an option that detached before the key was dispatched, trigger keyboard handlers stopped a key they never used, and the trigger's tooltip took whatever got past from a document-level listener once focus returned. Tooltips no longer open when focus is restored rather than the user arriving, and `ListBox`, `Picker` and `FilterPicker` now release `Escape` — and only `Escape` — to whatever surrounds them.
