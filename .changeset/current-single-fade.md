---
'@cube-dev/ui-kit': patch
---

Fix the `current` theme fading a disabled label twice, and pin the `invert` fill base across states.

**Single fade per subtree.** `current.item` and `current.clear` already suppressed their own `.4` label fade when the disabled state was inherited from a host that had faded `currentcolor` already, but `current.outline`, `current.outline-2`, `current.primary` and `current.link` stated it as a bare `disabled`. Two of those — `outline` and `primary` — are reachable `Item.Action` types, so an action inside a disabled row (including `Banner`'s outline actions) multiplied the two fades and rendered at `.16` of the row's color, washing out both the label and the alpha chip.

Every `current` flavour now gates the fade on `disabled & !inherit-disabled & !inside-wrapper`. The second mod closes the other half of the same hole: `ItemButton` renders its actions as siblings of the row inside a wrapper, and the wrapper reproduces the row's disabled color so those siblings inherit a faded `currentcolor`. It previously could not, because the gated key was skipped when deriving the wrapper's colors — so a disabled `ItemButton` on the `current` theme sat next to full-strength actions. The wrapper now reads the gated value, and the row suppresses its own fade under `inside-wrapper`, leaving exactly one `.4` on every path.

**Fill base.** `invert` swapped its fill's base layer on `disabled` (`accent-text` → `#surface`, and `#white` → `#special-surface` on the special theme) while keeping the same two-layer shape. The disabled chip is an opaque glaze tone so nothing changed at rest, but the base animated underneath a still-transparent overlay during the transition — the surface flash `primary` pins its own base to avoid. The base is now constant across all four states.
