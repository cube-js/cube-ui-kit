---
'@cube-dev/ui-kit': patch
---

Add an optional `scheme` prop to `CubeLogo` / `CubeFullLogo`.

The mark is two drawings swapped by the `@dark` state, which is resolved against the document. `scheme="light" | "dark"` pins one of them for cases where the background is known but the document scheme does not describe it — a fixed-dark panel in a light app, an exported image, or a region themed through `tokens` (which overrides token *values*, and so cannot reach a state). Omitting it keeps today's behaviour: the CSS swap, with no re-render and correct SSR.
