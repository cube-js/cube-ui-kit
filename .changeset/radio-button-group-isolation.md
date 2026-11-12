---
'@cube-dev/ui-kit': patch
---

**Radio.Group `type="button"`:** the group isolates its stacking (`isolation: isolate`), so the selected button, which is raised above its neighbours to show its border, can no longer paint over a sticky header or another positioned element outside the group. Nothing else about its look changes.
