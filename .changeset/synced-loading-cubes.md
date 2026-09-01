---
'@cube-dev/ui-kit': patch
---

`LoadingAnimation` now picks up the page's current animation phase instead of starting from the first frame, so a loader that remounts — which is what happens when another level of a loading page adds a wrapper around it — no longer visibly snaps back to the start, and every loader on the page runs in step.
