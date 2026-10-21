---
'@cube-dev/ui-kit': patch
---

`Select`, `ListBox` and the pickers built on it: a mouse press on an option of a list that closes under it, as a scroll of the page around it closes it, now selects that option even when the list has finished its exit and unmounted before the release. As before, the pointer has to come up inside the box the option had when the press started, and a release elsewhere selects nothing. A `Select` list fades out quickly enough that such a press used to pick nothing.
