---
"@cube-dev/ui-kit": minor
---

Add support for dual-color `fill` style. When two color tokens are provided (e.g., `fill="#primary #secondary"`), the first color is applied as `background-color` and the second as a `background-image` gradient layer via a registered CSS custom property (`--tasty-second-fill-color`), enabling smooth CSS transitions. Explicit `backgroundImage` or `background` properties override the second color.
