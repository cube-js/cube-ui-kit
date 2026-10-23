---
'@cube-dev/ui-kit': patch
---

Add three tokens for values that used to be written as border widths but aren't borders, so changing `--border-width` now moves only borders:

- `$ring-width` (`1px`), the width of a focus or selection ring. Every focus outline uses it, and so do the selection rings in `TableBase`, `Tabs`, `ColorSwatchGroup` and the color picker.
- `$outline-offset` (`1px`), a ring's gap from its element. The focus rings of `Button`, `ItemAction`, `Item`, `InlineInput`, `Checkbox`, `Switch`, `Slider`, `TagInput`'s tags, `Calendar` (at half), `ListBox` options (inward), `TableBase` and the `Layout` and `ResizablePanel` resize handles use it.
- `$item-gap` (`1px`), the hairline between adjacent items. `Menu`, `Select`, `ListBox` and the other `listGap` lists, `Item` actions, `Pagination`, vertical `Tabs` and the `Layout` breadcrumbs use it.

The tiny scrollbars, `Tooltip` arrow and halo, drop indicators, `Slider` track, `Tabs` indicator, `Calendar` cell spacing, `DatePicker` segments and resize-handle dots keep their own device-pixel sizes. `FileInput`'s padding and `CopyPasteBlock`'s padding and focus border compensate for a border, so they now use `bw`. The `Tabs` drop-indicator offset and `ItemTable`'s search width cap use `x`. Rendered sizes are unchanged at the defaults.
