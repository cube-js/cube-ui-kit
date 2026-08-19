---
'@cube-dev/ui-kit': patch
---

Fix the `selected & disabled` state on the `outline`, `outline-2` and `clear` types across the `default`, `danger`, `success`, `warning` and `note` themes: it was heavier than the enabled state it is supposed to mute.

The state borrowed `accent-disabled-surface` / `accent-disabled-surface-text` — the pair built for a PRIMARY button, whose enabled state is already an opaque brand fill under a `#white` label, so a mid-tone chip is a step _down_ there. On a non-solid type it is a step _up_: against a 9% brand tint under soft accent text, the `-13` chip read as a filled pill, and its `tone: 'max'` label resolved to literal white in light mode. A disabled segmented control therefore drew more attention than a live one, and the selected option looked like the only enabled one.

Two new accent tokens replace it, `accent-disabled-surface-soft` and `accent-disabled-surface-soft-text`. They reuse the NEUTRAL disabled geometry exactly — the same `-3.5` chip and `-23` label tone deltas against `surface`, adaptive rather than fixed, so the weight matches in light, dark and high contrast — and differ from `disabled-surface` / `disabled-surface-text` only in chroma: roughly 8× on the chip and 3.6× on the label, both still faint. Selection survives as a brand tint on a chip of unchanged weight, which is the one channel left once weight is spoken for, and it is what CUB-3912 asked for in the first place: a disabled segmented control still shows which option is active.

No existing token changed value — the palette snapshot diff is purely additive. `primary` keeps `accent-disabled-surface`, which is correct for a solid fill; the `special` and `current` themes keep their own white-alpha and `currentcolor` registers.
