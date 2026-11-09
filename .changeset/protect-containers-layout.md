---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` treats `Alert`, `Result` and `Skeleton` as containers, so `tasty/no-protected-restyle` accepts the props that lay out their content (`padding`, `gap`, `flow`, `place*`, `align*`, `justify*`, `grid*`, `overflow`, `scrollbar`), and a `styles` that sets only those. `Placeholder` also keeps `radius`, the shape of what it stands in for. Their appearance props (`fill`, `border`, `color`, `preset`) are still reported.
