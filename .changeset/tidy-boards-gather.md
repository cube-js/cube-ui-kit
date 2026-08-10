---
'@cube-dev/ui-kit': patch
---

`Board`: keep a multi-select group contiguous when compaction reorders it, and add `extraRows`.

Dragging a selected group past other widgets on a compacting board could split it — the widgets
it passed were packed _between_ the group's members, because compaction sorts every item by
`(y, x)` and packs each one independently. The group is now compacted as a single consecutive
run, with the displaced widgets landing past it. Gravity still wins: the block is never held in
mid-air, and the result is unchanged for every layout that was already correct.

The new `extraRows` prop keeps N empty grid rows below the content. A board hugs its content, so
once the grid fills up there is no empty space left to start a marquee selection in — and none to
drop a widget past the end of the board either. `extraRows` reserves a band for both; grid lines
paint over it so it reads as board rather than page background.
