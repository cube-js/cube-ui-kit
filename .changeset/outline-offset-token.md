---
'@cube-dev/ui-kit': patch
---

Add the `$outline-offset` token (`1px`), the gap between a focus outline and its element. The focus rings of `Button`, `ItemAction`, `Item`, `InlineInput`, `Checkbox`, `Switch`, `Slider`, `TagInput`'s tags, `Calendar` (at half), `ListBox` options (inward), the `TableBase` column resizer and drop indicator, and the `Layout` and `ResizablePanel` resize handles use it. The `TableBase` and `ListBox` offsets no longer follow `--border-width`. `FileInput`'s padding and `CopyPasteBlock`'s padding and focus border compensate for a border, so they now use the `bw` unit and follow `--border-width`. The `Tabs` drop-indicator offset and `ItemTable`'s search width cap use the `x` unit. Rendered sizes are unchanged at the defaults.
