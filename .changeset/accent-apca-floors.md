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
