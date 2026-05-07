---
'@cube-dev/ui-kit': patch
---

`Result` now sets a default `width: max 80ch` and centers itself horizontally (`margin: 0 auto`) in non-compact mode, capping the component at a comfortable reading width (~80 characters) on wide screens. Pass a `width` or `margin` prop to override.
