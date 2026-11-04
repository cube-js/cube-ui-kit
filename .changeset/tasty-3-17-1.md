---
'@cube-dev/ui-kit': patch
---

Update `@tenphi/tasty` to 3.17.1. It adds compound colors (`'#surface+#dark.04'`), which layer color tokens into one color that works in every color slot, and deprecates mixing two `fill` colors with a comma (`'#dark 4%, #surface'`), which now warns in development. UI Kit's own 74 comma mixes, in the item themes and the table cells, are rewritten as compound colors and compile to the same colors. The table's `$row-overlay-weight` is now a number from 0 to 1 (`0.04` rather than `4%`), because a compound color reads it as the overlay's opacity. Tasty's base config also lists `$icon-size`, which every `preset` sets.
