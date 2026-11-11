---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lets a container that draws no fill and no border of its own (`Layout`, `GridLayout`, `Panel`, `ResizablePanel`, `Content`, `Header` and `Footer`) keep `fill` and `border`, so `tasty/no-protected-restyle` accepts a page backdrop such as `<Layout fill="#surface-2">` or a divider such as `<Panel border="top">`. `Layout`'s sections (`Layout.Content`, `Layout.Header`, `Layout.Toolbar` and the rest) keep `fill` only: the border that separates stacked sections is UI Kit's. `Card`, `Layout.Panel` and the other containers with a surface of their own stay as they were. Every container also keeps `textAlign`, which aligns the content it holds, and `container`, which names it for its content's container queries.
