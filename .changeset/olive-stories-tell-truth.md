---
'@cube-dev/ui-kit': patch
---

**ItemTable, DataTable**: stories no longer turn sorting on behind your back.

Both shared story fixtures marked every column `isSortable: true`, so all 15
`DataTable` stories and every `ItemTable` story rendered clickable headers with
hover affordances — including `Default`, which is where people go to learn what
the component does without configuration. Sorting is opt in per column, so those
stories were showing the opposite of the default.

The fixtures are now plain, and the stories that are actually about sorting use
an explicit `SORTABLE_COLUMNS`.
