---
'@cube-dev/ui-kit': patch
---

Stop using the `bw` unit for values that aren't border widths, so changing `--border-width` now moves only borders, dividers and the sizes that make room for a border. Two new tokens cover the shared values:

- `$ring-width` (`1px`), the width of a hairline focus or selection ring. The hairline focus outlines use it (a field's thick focus ring stays `ow`, `$outline-width`), and so do the rings drawn with `shadow` in `TableBase`, `Tabs`, `ColorSwatchGroup` and the color-picker thumb. `RadioGroup` and `ColorSwatchGroup` also take their ring offset from `$outline-offset` now.
- `$item-gap` (`1px`), the hairline between adjacent items. `Menu`, `Select`, `ListBox` and the other `listGap` lists, `Item` actions, `Pagination`, vertical `Tabs` and the `Layout` breadcrumbs use it, and `listGap` documents it as its default.

The resize-handle dot gaps, `Calendar` cell spacing, `DatePicker` segment padding, the `Tabs` indicator, the `TableBase` drop indicators and the resizer's hover line keep their own device-pixel sizes, and `$item-shadow`'s offset is a plain `1px`. Rendered sizes are unchanged at the defaults.
