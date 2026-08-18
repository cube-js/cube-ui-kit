---
'@cube-dev/ui-kit': patch
---

A pinned brand color is held to an APCA floor instead of a WCAG ratio, which softens the constraint where it was over-tight.

Custom color mode only. The shipped palette is untouched — it runs the `null` accent arrangement, whose `['AA','AAA']` floors are unchanged and still snapshotted.

WCAG 2.x is polarity-blind, so the old `[3, 7]` meant two very different things depending on the scheme. Measured with Glaze's own `apcaContrast` across 12 hues at 30° steps, the fill sitting exactly at the old floor comes out at **Lc 56.2 in light** (55.8–56.5) but only **Lc 23.3 in dark** (22.7–24.4). Hue is not a factor — the spread is under 2 Lc across the whole wheel — polarity is. One number was therefore 2.4× stricter in light than in dark, which is why light brands kept getting crushed while dark ones sailed through, and it left dark-mode fills below APCA's own `non-text` floor of 30.

- `accent-surface` → `{ apca: [45, 85] }`. Lc 45 is APCA's `large` tier. The base stays `surface`, so with the `bg` polarity Glaze solves `apcaContrast(surface, fill)` — in light, where `surface` is `oklch(1 0 0)`, that is white-on-fill, the pair every `type="primary"` label rides on.
- `accent-text-soft` → `{ apca: [60, 85] }` and `accent-text` → `{ apca: [75, 92] }`, APCA's `content` and `body` tiers, one step apart so the rest→hover intensify cannot collapse onto one color.

In light this is a real relaxation: the floor drops from ~WCAG 3.0 to ~WCAG 2.3, giving a brand about 8 tone points more headroom before it is darkened. `#0EA5E9` now renders at 2.77 against the page instead of being pushed to 3.0.

Two things worth knowing. The high-contrast tier can no longer say "AAA in both schemes": WCAG 7 is Lc 83.5 in light but Lc 54.4 in dark, so no single Lc restates it. `85` is the closest — ~6.1 in light, a shade under AAA, and ~15 in dark. And the tier has to be APCA at all because Glaze rejects a `contrast` pair that switches metric between its normal and high-contrast entries, which is a fair guard rather than something to work around.

Anchoring the fill to `accent-surface-text` to make "from white" literal in both schemes was tried and rejected: in dark the label root is near-white while the page is not, so the floor stopped constraining the fill against the page and `#111827` came out at WCAG 1.16 against the dark surface — invisible.

The fill carries **two** floors, not one, because in dark they pull opposite ways and dropping either produces the mirror image of the other's failure.

Glaze takes one `base` per color, so only the page floor can be expressed as a `contrast`; the label floor is a cap on the seed tone, searched against Glaze's own fixed-mode resolution rather than a reimplementation of the dark tone window. It only ever lowers, so a brand that was already dark enough is emitted unchanged.

- **Page floor** (`contrast` against `surface`) — the button has to be a visible shape. Without it `#111827` puts the fill at **Lc 0.0 against the dark page**: a blazing white label on a shape that is not there. The border does not stand in for it, being deliberately low-contrast.
- **Label floor** (the seed cap) — the `#white` that every `type="primary"` item paints has to be readable. Without it `#FFFFFF` clears the page floor in dark at WCAG 14.4 while the label lands on **Lc 0** — the label is exactly its own fill.

In light the page IS white, so the two collapse into the single measurement Glaze already makes and the cap never fires.

This also reaches the `special` theme, whose `SPECIAL_PRIMARY_STYLES` paints `#white` on the same brand fill. `#FFD400` is one of the colors the cap moves — white on it untouched is Lc 28 — so the brand's hue carries into the hero button but its tone is capped. The test that asserted the literal survived unchanged now asserts the hue arrived, since exact equality there was a demand that the button's own label be unreadable.
