---
'@cube-dev/ui-kit': patch
---

**DataTable, ItemTable**: a sortable header now previews its sort arrow. Hovering
or keyboard-focusing a sortable column fades the arrow in at 40%, pointing the
way a press would sort it; pressing it makes the arrow solid, and it stays solid
once the pointer leaves. Previously a sortable column looked identical to a
non-sortable one until it was already sorted.

The arrow keeps its slot throughout, so nothing shifts, and a non-sortable column
still has no arrow.
