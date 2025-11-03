---
'@cube-dev/ui-kit': minor
---

Add support for `:has(Item)` syntax in style mappings. Capitalized element names inside `:has()` pseudo-class selectors are now automatically transformed to `data-element` attribute selectors (`:has(Item)` → `:has([data-element="Item"])`).
