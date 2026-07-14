---
"@cube-dev/ui-kit": patch
---

`Board`: fix drags creating overlapping widgets in non-compacting modes (`compact={null}` or `preventCollision`). Moving a widget so it pushed a neighbour could stack that neighbour on top of another widget. Both keyboard and pointer moves now reject any step whose resulting layout has overlapping widgets — keyboard scans further for a clear slot, pointer keeps the widget at its last valid arrangement — so the two inputs behave consistently and neither ever stacks widgets (unless `allowOverlap` is set). Widgets still push/swap neighbours whenever the move resolves without an overlap.
