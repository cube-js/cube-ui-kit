---
"@cube-dev/ui-kit": patch
---

A focused control that is disabled through `aria-disabled` and then enabled again shows its focus ring again. Browsers fire no focus event in that case, so `Button`, `ItemAction` and the other controls built on the shared focus hook used to stay without a ring until focus moved away and back.
