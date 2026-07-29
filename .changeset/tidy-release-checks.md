---
'@cube-dev/ui-kit': patch
---

Release-pipeline maintenance, no runtime changes: the `Build & canary release` check is no longer reported twice by two different workflows, and the Version Packages PR no longer publishes a redundant canary or leaves a stale `pr_*` dist-tag behind.
