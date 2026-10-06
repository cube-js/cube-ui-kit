---
'@cube-dev/ui-kit': patch
---

A long toast now stays within `min(100vw - 4x, 50x)` and wraps its message. Its wrapper used to have a `max-content` minimum width, which beat the cap, so the toast ran off both edges of a narrow viewport.
