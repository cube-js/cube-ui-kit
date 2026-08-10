---
'@cube-dev/ui-kit': patch
---

Fix the `ItemTable` drop indicator being invisible and shifting rows.

The indicator's `<td>` carried no `data-element`, so neither the cell rule nor
the line rule matched it: the cell kept its UA padding, which pushed the rows
apart by a pixel, and the line got no fill or height at all. The cell is named
now, the row and cell collapse to nothing, and the line is positioned out of
flow so it sits *on* the row divider instead of displacing it.

Also scopes the indicator's focus ring with `@own(:focus-visible)`. Written
bare, it compiled to "when the whole table is focused" — a sub-element's state
keys resolve against the root.
