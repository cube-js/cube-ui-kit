---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.11.1 (from 3.10.0). The kit needed no changes. For apps built on it:

- `tasty(Base, options)` now applies the options it type-checks: `styleProps`, `modProps` and `tokenProps` become styles, mods and tokens instead of reaching `Base` as unknown props, `variants` apply over the extension's `styles`, and `elements` adds sub-elements. The `variant` option sets the default variant, in `tasty({ variants, variant })` too, where it used to reach the DOM as an attribute.
- `#clear` is always `transparent` and no longer reads `--clear-color`, so overriding that property has no effect.
- A `border` or `outline` with no color is drawn in the text color unless `#border` or `#outline` is defined. The kit defines `#border`, not `#outline`.
- `@media` and `@container` conditions resolve units to literal lengths. The kit's `x`, `r`, `cr`, `bw` and `ow` units are custom properties, which still cannot work in a query condition, and Tasty now reports one there in development.
- `width: 'stretch'` and the other size styles emit each engine's fallback, `transition: 'zIndex'` transitions `z-index`, container queries over `aspect-ratio` and `orientation` apply, and media query bounds in different units are compared correctly.
- CSS built with `extractStylesWithChunks()` or `extractStylesForSelector()` also needs `extractConfigProperties()` from `@tenphi/tasty/zero`, once per stylesheet.
