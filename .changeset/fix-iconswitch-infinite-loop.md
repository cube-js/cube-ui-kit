---
"@cube-dev/ui-kit": patch
---

Fix infinite loop in IconSwitch component caused by unnecessary state updates when children prop reference changes. The component now renders current children directly for the active icon instead of storing it in state, preventing render loops while maintaining proper transition behavior.