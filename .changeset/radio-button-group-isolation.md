---
'@cube-dev/ui-kit': patch
---

**Radio.Group `type="button"`:** the group isolates its stacking (`isolation: isolate`), so the selected button, which is raised above its neighbours to show its border, can no longer paint over a sticky header or another positioned element outside the group. And an `xsmall` button is at least 26px wide instead of 24px: its neighbours cover one border width of each side, so it keeps a 24px target (WCAG 2.5.8). The other sizes look the same.
