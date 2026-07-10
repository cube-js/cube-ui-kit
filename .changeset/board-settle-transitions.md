---
"@cube-dev/ui-kit": patch
---

`Board`: widgets no longer animate (`inset` transition) on initial render. The board now waits for widgets to paint at their first measured positions before activating position transitions, so they settle into place instead of sliding in from their default spot. Transitions still apply to subsequent reflows (drag/resize of neighbours, compaction, aligned-column changes).
