---
"@cube-dev/ui-kit": patch
---

`ResizablePanel`'s `innerStyles` now merges with the panel's own inner styles instead of replacing them. The fix is in `mergeProps`, which now merges `styles` and every `*Styles` key (`innerStyles`, `inputStyles`, …) whenever both objects hold a styles object for that key, whether or not they also pass `styles`.
