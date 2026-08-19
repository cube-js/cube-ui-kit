---
'@cube-dev/ui-kit': patch
---

Four fixes to the pinned-brand accent path, from review.

**An explicit `hue` now rotates the whole accent ramp.** `resolveConfig` ranks a numeric `hue` above the one an `accentColor` carries, but `buildPalette` handed Glaze the original literal — so `accent-surface` kept the color's hue while `-2`, `-3` and `hover` followed the theme's. A primary button changed hue on hover. The seed is now built from the resolved hue, chroma and tone rather than the string, and the regression test asserts on emitted tokens rather than on `getPaletteConfig().hue`, which was already correct while the ramp was split.

**The white-label floor now holds on the emitted fill.** The ceiling was computed on the bare seed, but what ships is the fill after the page floor has had its turn — and that floor can only lighten, which is what weakens a white label. A 3072-case sweep over hue, chroma, tone, scheme and tier found 720 failures, the worst putting the label at Lc 20.7. Three things fixed it: the ceiling is now a property of the hue/chroma pair rather than of the tone asked for (it previously only searched when the requested tone already failed, so a dark tone probed first let every later light tone escape), it searches to a measured +3 Lc margin so the page floor cannot eat back through 45, and the high-contrast page floor drops from Lc 85 to 60.

That last one is geometry, not preference. The two floors pull opposite ways in dark: the page wants a lighter fill, the label a darker one. The window they share is `L ∈ [0.605, 0.735]`, and asking 85 of the page empties it outright — 60 is the largest value that keeps it open, with 65 reopening 768 failures. High contrast escalates the fill only as far as its own label can follow.

**The accent-cap cache is versioned.** It resolves through Glaze's global settings, including the dark tone window, so a caller running `glaze.configure(...)` then `invalidatePaletteTokens()` had changed the answer without changing the seed. Keyed on the palette version now, which is what makes that API mean what it says.

**Replacing one unparseable color with another registers.** Both resolve to `null`, and the pin signature recorded only whether the field was present, so `setPaletteConfig({ accentColor: 'bad-two' })` after `'bad-one'` returned early — input kept the first string and no subscriber heard. The signature carries the two color values now.

Documentation across the JSDoc, the Theme Builder tooltip, `Theming.docs.mdx` and the earlier changeset no longer promises WCAG 3:1. The floors are APCA Lc 45, and an emitted fill can legitimately sit under 3:1 — `#0EA5E9` renders at 2.77:1 and is correct there.
