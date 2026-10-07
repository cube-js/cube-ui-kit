---
'@cube-dev/ui-kit': patch
---

`toast({ duration: null })` keeps the toast until it is dismissed, as the docs say. It used to fall back to the 5-second default, which only a missing `duration` should do. Notifications already handled `null` this way.
