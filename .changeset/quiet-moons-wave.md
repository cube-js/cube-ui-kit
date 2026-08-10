---
'@cube-dev/ui-kit': minor
---

Hide `ItemTable` pagination when it cannot do anything.

A single page of five rows rendered "1–5 of 5", a page-size selector whose every
option showed the same five rows, and a solitary "1" button. The control now
hides itself when both conditions hold — a single page **and** a total that even
the smallest `pageSizeOptions` entry would not split — so a 15-row single page
keeps its control, because "10 / page" would genuinely paginate it.

On by default via the new `autoHidePagination` prop; set it to `false` to always
show the control. The footer itself still renders whenever a slot has content.
