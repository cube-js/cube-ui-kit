---
'@cube-dev/ui-kit': patch
---

Update `@tenphi/glaze` 1.2.0 → 1.3.0. **Resolved colors are unchanged**: every token was dumped in all four scheme variants (`''`, `@dark`, `@hc`, `@dark & @hc`) and diffed against 1.2.0 — byte-identical.

1.3.0 adds the `contrastLevel` config field (a manual 0–100 contrast level replacing the two-tier high-contrast model, where levels 0 and 100 reproduce the normal and high-contrast output exactly), the `resolveContrastForLevel()` export, and the `preferInitial` contrast-solver option. Nothing existing changed behavior.

A new snapshot spec (`src/tokens/palette.test.ts`) pins the resolved palette — 156 tokens across four scheme variants — so a future Glaze bump or seed retune cannot move colors silently.
