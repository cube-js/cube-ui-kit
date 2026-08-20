---
'@cube-dev/ui-kit': minor
---

`LoadingAnimation` is retuned to sit next to the current monochrome `CubeLogo`, and the empty-crate illustration Cube Cloud has been carrying locally ships as `NoDataIcon`, drawn from the same three tokens.

**The faces are near-neutral now.** `loading-face-1..3` used to take a fraction of the *brand* seed saturation (0.3 / 0.62 / 0.66), which put the shadowed face at chroma **0.0676** — eight times `border` — so a spinner rendered as a purple gradient beside a logo drawn in `currentColor`. They now take `baseChroma(0.2)`, the same normalised share the neutral chrome takes (`border`, `placeholder`, the text ramp), landing at **0.0059 / 0.0161 / 0.0248**. The brand hue still carries, as a tint rather than as a color, and still follows a re-seeded palette.

**Contrast, not tone, is the spec.** A relative tone delta is uniform on the OKHST scale, but the dark scheme resolves it inside the `darkTone` window, which compressed the ramp to ~75% of its light span. Measured against `surface`:

| | face-1 | face-2 | face-3 |
|---|---|---|---|
| light, before | 1.063 | 1.320 | 1.915 |
| dark, before | 1.053 | 1.264 | **1.735** |
| light, after | 1.201 | 1.653 | 2.409 |
| dark, after | 1.212 | 1.666 | **2.424** |

Glaze has no per-color `darkTone`, so the intent moves into a WCAG floor against `surface` and each scheme solves for it. The authored `tone: '-2'` is deliberately short of every floor, so all three faces are pinned by the ratio rather than by a delta that means something different in each scheme — light and dark now agree to within 1%, and the whole ramp is roughly a third stronger than it was (Oklab ΔL 0.271 in light, 0.231 in dark, against 0.204 / 0.154).

WCAG rather than APCA, against the grain of the accent tokens: APCA's low-contrast clamp scores every step of a ramp this subtle as Lc 0, so it cannot express the difference between these three faces at all. Polarity-blindness — the reason APCA wins for text — costs nothing for a decorative fill whose only job is to separate from the page.

High contrast used to be *identical* to the normal tier here, because an unconstrained tone delta had nothing to escalate. The `[1.35, 2.1, 3.2]` HC entries roughly double each step's distance from the page.

**`NoDataIcon`** is the isometric open crate used for empty tables and empty lists, moved out of `cubejs-enterprise` and onto the shared tokens — the local copy hard-coded `#e5e5ec` / `#b4b4c5` / `#69697c` and re-derived a dark variant in JS on every scheme change.

It ships as an **illustration component** alongside `CubeLogo`, not as a member of the icon set, because it is not an icon in the two ways that matter: it is a three-tone drawing rather than a `currentColor` glyph (so it ignores `color` — flattening the faces to one tone loses the box), and it is drawn full-bleed rather than inset in a 24×24 grid (so it belongs at `size="8x"` and up, not inline with text). It is still built on `Icon`, so sizing and style props behave exactly as they do for one.

The token names stay `loading-face-*` so Cube Cloud's theme color map keeps resolving; they now cover both pieces of artwork, and the recipe comment says so.
