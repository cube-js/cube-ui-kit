---
"@cube-dev/ui-kit": patch
---

A component's `*Styles` props, such as `ResizablePanel`'s `innerStyles`, now merge with the component's own styles instead of replacing them. `mergeProps` now merges `styles` and every `*Styles` key whenever both objects hold that key, whether or not they also pass `styles`.
