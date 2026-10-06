---
'@cube-dev/ui-kit': patch
---

A long toast now stays within `min(100vw - 4x, 50x)` and wraps its message, breaking a word that is wider than the toast, such as a URL. Its wrapper used to have a `max-content` minimum width, which beat the cap, so the toast ran off both edges of a narrow viewport. Toasts and notifications also restack when a viewport resize changes their height, instead of overlapping until the next render.
