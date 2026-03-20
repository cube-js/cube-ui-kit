---
'@cube-dev/ui-kit': patch
---

Defer `Tabs` `onTitleChange` with `requestAnimationFrame` so controlled title updates apply after React has committed state.
