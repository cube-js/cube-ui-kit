---
'@cube-dev/ui-kit': patch
---

Fix a color-seeded accent fill collapsing to one value across the dark tone range.

The brand fill answers to two APCA constraints, and they were sized the same. The `#white` label it carries needs Lc 45 — text strength, because it is text. The page it sits on was asked for Lc 45 too, escalating to Lc 60 in high contrast, which is a demand that a filled shape reach text-grade contrast against the background.

Nothing in the palette meets that. Measured on the emitted tokens, the **shipped** `accent-surface` — the white-anchored ladder every primary button used before color seeds existed — sits at **Lc 25.5** off the dark page and **Lc 19.3** in dark high contrast, where the ladder darkens the fill toward its label. So a color-seeded fill was being held to 1.8x and 3.1x what the design system's own button achieves.

The two look identical in light, which is how it went unnoticed: there `surface` **is** white, so one measurement is both constraints at once and Lc 45 is right for the pair. In dark the page is near-black, and because a floor can only lighten, the surplus flattened the tone axis: every seed below the floor solved to the same fill. Measured across the axis at one hue, the dark fill was pinned at tone 66 for every seed from 5 to 65 — a brand's whole dark half collapsing onto one lavender — while light passed the same seeds through untouched. In dark high contrast the floor met the label cap and left a window of a single value.

The page floor is now **Lc 25 in both tiers**, calibrated to the shipped fill rather than to a text threshold. The same sweep now tracks the seed from tone 47 up, and 47 is where the shipped fill sits in dark, so the dark range went from 7.7 tones to ~27 against light's ~45. The pair is written with both entries equal in order to suppress APCA's automatic +15 Lc enhancement in high contrast: that tier is a request for separation over brand, but not for separation from the page — the same fill carries the label, and driving it off the page drives the label off it.

The white label is unaffected. It never depended on this number: it is guaranteed by the tone cap on the seed, which searches all four variants against pure white. A lower page floor lightens less, so it makes that guarantee safer rather than weaker.

Light mode is unchanged — a dark brand on a white page measures Lc 100+, so this floor never bound there. Palettes with no color seed are untouched: the white-anchored ladder keeps its `['AA','AAA']` floors.
