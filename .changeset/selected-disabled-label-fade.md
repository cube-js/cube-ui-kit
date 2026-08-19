---
'@cube-dev/ui-kit': patch
---

Fix the `selected & disabled` state on the `outline`, `outline-2` and `clear` types across the `default`, `danger`, `success`, `warning` and `note` themes: it was heavier than the enabled state it is supposed to mute.

The state borrowed `accent-disabled-surface` / `accent-disabled-surface-text` — the pair built for a PRIMARY button, whose enabled state is already an opaque brand fill under a `#white` label, so a mid-tone chip is a step _down_ there. On a non-solid type it is a step _up_: against a 9% brand tint under soft accent text, the `-13` chip read as a filled pill, and its `tone: 'max'` label resolved to literal white in light mode. A disabled segmented control therefore drew more attention than a live one, and the selected option looked like the only enabled one.

It now keeps the enabled selected chip and fades only the label. The chip is the thing that says "this one is on", so it does not change weight at all when the control goes disabled; the label drops to a new `accent-disabled-text` token — the neutral `disabled-surface-text` geometry (the same `-23` tone delta against `surface`, adaptive, so it reads exactly as disabled as every other disabled label in light, dark and high contrast) carrying brand chroma instead of neutral, at roughly 2× `disabled-surface-text` and comfortably under `accent-text-soft`. Selection survives as a hue on a label of unchanged paleness, which is what CUB-3912 asked for: a disabled segmented control still shows which option is active.

The chip's tint is written as `.08` rather than reusing `selected`'s own `.09`, and the difference is deliberately imperceptible. The two entries must not serialize to the same string: Tasty's `mergeEntriesByValue` pass coalesces equal values into one OR-entry at the group's max priority, so a literal reuse would merge `selected` into `selected & disabled` and then negate against `selected & (hovered | focused)` — the "selected-hover stays dark" bug that `SPECIAL_CLEAR_STYLES` documents and escapes the same way.

No existing token changed value — the palette addition is `accent-disabled-text` and nothing else. `primary` keeps `accent-disabled-surface`, which is correct for a solid fill; the `special` and `current` themes keep their own white-alpha and `currentcolor` registers.
