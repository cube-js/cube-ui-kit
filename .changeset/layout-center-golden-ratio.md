---
'@cube-dev/ui-kit': minor
---

`Layout.Center` now accepts an `isGoldenRatio` prop. When enabled, the content is positioned slightly above the geometric center using the golden ratio (~38.2% empty space above, ~61.8% below) for a more aesthetically pleasing placement. The behavior only applies while the content fits inside the container; otherwise default centering and scrolling are preserved.
