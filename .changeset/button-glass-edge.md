---
"@cube-dev/ui-kit": minor
---

Outline and primary buttons now draw a glass edge, matched to macOS controls, instead of a solid border: a hairline ring that is light at the top and bottom and dark along the sides, thin highlight lines and a soft sheen along the top and bottom edges, a large inner shade under the glow in light mode, and an outer shadow that collapses while pressed. In dark mode a translucent tint lifts outline buttons off the page. Disabled buttons keep a flat ring only. Sizes and layout are unchanged. The layers come from the new `$glass-ring`, `$glass-highlight`, `$glass-sheen`, `$glass-inner-shade`, `$glass-tint` and `$glass-halo` tokens (with `-accent` versions for brand fills, and `$glass-ring-disabled`), which adapt to dark and high-contrast schemes.
