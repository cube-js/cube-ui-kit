---
"@cube-dev/ui-kit": patch
---

`Board`: improve keyboard and focus behavior for draggable widgets. Clicking an eligible drag zone now focuses the widget; keyboard focus shows an adaptive focus ring (`:focus-visible`). Arrow-key moves respect layout constraints, scan past blocked cells to the next valid slot, and reflow neighbours without overlap where the board mode allows. Widget position transitions now include `width` and `height`.
