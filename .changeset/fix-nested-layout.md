---
"@cube-dev/ui-kit": patch
---

Fix nested Layout panels affecting parent layouts by splitting context into actions and state, and add LayoutContextReset component to isolate nested panel contexts.

Layout.Panel now uses React portals for rendering, which allows panels to work correctly even when wrapped in custom components. This removes the need for child detection heuristics and ensures reliable panel positioning regardless of component composition.
