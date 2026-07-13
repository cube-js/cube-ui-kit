---
"@cube-dev/ui-kit": patch
---

`Board`: fix keyboard moves creating overlapping widgets. When moving a focused widget with the arrow keys in a non-compacting mode (`compact={null}` or `preventCollision`), a pushed neighbour could be stacked on top of another widget. Keyboard moves now reject any step whose resulting layout has overlapping widgets and scan further for a clear slot instead, matching the pointer-drag behavior.
