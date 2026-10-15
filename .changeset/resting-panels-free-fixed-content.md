---
"@cube-dev/ui-kit": patch
---

`Layout.Panel` no longer keeps a transform while it is open and not sliding. Fixed-position content inside a panel, such as a drag preview or a popup, now positions against the viewport instead of the panel, and the panel's overflow no longer clips it.
