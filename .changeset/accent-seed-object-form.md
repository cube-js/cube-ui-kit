---
'@cube-dev/ui-kit': patch
---

The accent label cap hands Glaze its probe seed as an `OkhstColor` instead of a formatted string.

`from` accepts `string | OkhslColor | OkhstColor | RgbColor | OklchColor`, so the seed never needed to become text. Dropping `formatOkhst` removes the writers' scale question from this path entirely — and with it the two decimal places `okhst()` rounds to. `#7A4DBF` round-tripped through a string came back `0.450200` against a true `0.450191`.

No Glaze change: `OkhstColor` is existing 2.0.0 API.

One test moves with it. The cap's floor is measured on the emitted token, whose `oklch()` string carries four decimals, so `#FFD400` now reads Lc 44.9925 where it used to read a hair over 45 — the string round-trip had been rounding it up. The assertion takes the same epsilon treatment the high-contrast one already had (`84.9` for an 85 target). The shortfall is 0.0075 Lc, three orders of magnitude below anything visible, and the change is in the direction of accuracy.
