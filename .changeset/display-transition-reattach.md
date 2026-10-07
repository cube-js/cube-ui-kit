---
'@cube-dev/ui-kit': patch
---

`DisplayTransition` finishes an exit when its `ref` is wrapped inline or with `mergeRefs`. Such a ref is new on every render, so React detaches it and re-attaches the same element. That dropped the transition listeners, so an exit that had already started never ended and the element stayed mounted.
