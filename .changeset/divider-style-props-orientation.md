---
'@cube-dev/ui-kit': minor
---

`Divider` applies its style props (`margin`, `width` and the rest of its documented set), which it used to drop silently, and takes a new `orientation="vertical"` prop that renders a vertical separator stretching to the height of its row. It no longer claims the `divider` grid area: inside a grid it now takes the next cell, where it used to land in an extra implicit column with zero width. A divider with text is now a separator named by that text for screen readers, and every divider carries `data-qa="Divider"` unless you pass `qa`. A component built with `tasty(Divider, …)` now renders a real `<hr>` separator too, where it used to render a `div` with no role, so screen readers announce it; hide one that is only decoration with `aria-hidden`.
