---
'@cube-dev/ui-kit': patch
---

Fixed a brief surface-color flash that appeared when toggling `isSelected` on `outline` / `outline-2` buttons (most visible inside `RadioGroup type="button"`) and when toggling `isDisabled` on `primary` buttons (e.g. on form submit). The flash came from a CSS-transition layer-count mismatch: tasty's `fill` renders single-color values as `background-color` only and two-color values as `background-color` + `--tasty-second-fill-color` + `background-image: linear-gradient(...)`. When a state with two layers transitioned to a state with one (or vice-versa), the gradient overlay snapped on/off instantly while `background-color` interpolated, exposing the base layer mid-transition.

Every `fill` state map in `src/data/item-themes.ts` now uses the same two-layer shape across non-selected, selected, and disabled states, with the same opaque base color (`#surface`, `#surface-2`, `#surface-3`, or `#special-surface` per variant). Only the overlay tint changes between states, so `background-color`, `--tasty-second-fill-color`, and `background-image` all interpolate smoothly. Visuals are essentially unchanged — the brand-tinted overlays now composite over the variant's own base instead of the body surface, producing a sub-1-OKHSL-point lightness shift that's imperceptible in side-by-side comparisons.
