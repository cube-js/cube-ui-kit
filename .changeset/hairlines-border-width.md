---
'@cube-dev/ui-kit': patch
---

Hairlines, strokes and outline offsets that were hardcoded in pixels now use the `bw` unit, so they follow `--border-width` like the kit's borders:

- focus-ring offsets on `Button`, `Checkbox`, `Switch`, `Calendar` and others;
- the resize handles of `ResizablePanel` and `Layout`'s panels and panes;
- the tiny scrollbars in `Layout` and `Tabs`;
- the `Tooltip` arrow and shadow, the `ListBox` drop indicator and the `Slider` track;
- border compensations in `FileInput`'s padding and `CopyPasteBlock`'s padding and focus border.

The `Tabs` drop-indicator offset and `ItemTable`'s search width cap use the `x` unit, so they follow `--gap`. Rendered sizes are unchanged at the default `1px` border width and `8px` gap.
