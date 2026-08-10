---
'@cube-dev/ui-kit': patch
---

Render the `ItemTable` sort arrow in the header `Item`'s `rightIcon` slot
instead of `suffix`.

`suffix` is a text slot, so the glyph sat on the label's baseline. `rightIcon`
is sized and aligned for an icon, which puts the arrow at the end of the header
cell where a sort indicator belongs. The slot is still reserved while unsorted,
so toggling a sort never shifts the label.

A `header.rightIcon` the consumer set keeps the slot, and the arrow falls back
to `suffix`.
