---
'@cube-dev/ui-kit': patch
---

Update `@tenphi/tasty` to 3.17.1. It adds compound colors (`'#surface+#dark.04'`), which layer color tokens into one color that works in every color slot, and deprecates mixing two `fill` colors with a comma (`'#dark 4%, #surface'`), which now warns in development. UI Kit's own 74 comma mixes, in the outline item themes and the table cells, are rewritten as compound colors, or as `color-mix()` where a custom property sets the weight, and compile to the same colors. Tasty's base config also lists `$icon-size`, which every `preset` sets.
