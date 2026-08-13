---
'@cube-dev/ui-kit': patch
---

`Board`: widgets a marquee (lasso) currently covers now preview the selection while the pointer is still down, instead of only lighting up on release. They carry a new `pre-selected` modifier (`data-pre-selected`) — the selected edge with its ring dimmed — which is restylable exactly like `selected` and is never set on a widget that is already selected.
