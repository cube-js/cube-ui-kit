---
'@cube-dev/ui-kit': patch
---

Fix `Disclosure` trigger corners in the `card` shape: the trigger now matches the card's inner radius while collapsed and rounds only its top corners while expanded, and the change is animated. The animation follows `transitionDuration` so the corners stay in step with the panel.

Fix `Disclosure` overflowing a flex or grid parent. The root now opts out of the automatic minimum size, so wide panel content (a code block, a table) is clipped by the panel rather than stretching the whole disclosure past its parent — `width="max 100%"` is no longer needed at the call site. Growing to fill a row flex parent remains the caller's decision via `flexGrow`.
