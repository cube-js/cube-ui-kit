---
"@cube-dev/ui-kit": patch
---

A control that keeps keyboard focus while disabled now shows its focus ring: a disabled `Button`, `ItemButton` or `ItemAction` that has a tooltip or renders as a link, and a disabled interactive `InfoBadge`. Before, the ring disappeared while the control was disabled and stayed gone after it was enabled, until focus left and came back. A control also no longer keeps a focus ring it lost without a blur, as when its tooltip is added or removed while it is focused and the element is replaced.
